import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/order.dto';
import { UsersService } from '../users/users.service';
import { TariffsService } from '../tariffs/tariffs.service';
import * as YooKassa from 'yookassa-sdk-node';

@Injectable()
export class OrdersService {
  private yooKassa: any;

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private configService: ConfigService,
    private usersService: UsersService,
    private tariffsService: TariffsService,
  ) {
    this.initializeYooKassa();
  }

  private initializeYooKassa() {
    try {
      this.yooKassa = new (YooKassa as any)({
        shopId: this.configService.get('YOOKASSA_SHOP_ID'),
        secretKey: this.configService.get('YOOKASSA_API_KEY'),
      });
    } catch (error) {
      console.warn('YooKassa not initialized. Payment functionality will not work.');
    }
  }

  async createPayment(userId: string, createOrderDto: CreateOrderDto): Promise<any> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let idempotencyKey = `${userId}-${Date.now()}`;
    let paymentData = {
      amount: {
        value: createOrderDto.amount.toString(),
        currency: 'RUB',
      },
      payment_method_data: {
        type: 'bank_card',
      },
      confirmation: {
        type: 'redirect',
        return_url: `${this.configService.get('FRONTEND_URL')}/payment-result`,
      },
      description: createOrderDto.description || 'Subscription payment',
      metadata: {
        userId: userId,
        tariffId: createOrderDto.tariffId,
      },
    };

    try {
      const payment = await this.yooKassa.payment.create(paymentData, idempotencyKey);

      const order = this.ordersRepository.create({
        paymentId: payment.id,
        amount: createOrderDto.amount,
        status: 'pending',
        type: createOrderDto.tariffId ? 'subscription' : 'service',
        tariffId: createOrderDto.tariffId,
        serviceId: createOrderDto.serviceId,
        description: createOrderDto.description,
        userId,
      });

      await this.ordersRepository.save(order);

      return {
        orderId: order.id,
        paymentId: payment.id,
        confirmationUrl: payment.confirmation?.confirmation_url,
        status: payment.status,
      };
    } catch (error) {
      console.error('Payment creation error:', error);
      throw new BadRequestException('Payment creation failed');
    }
  }

  async handleWebhook(paymentId: string): Promise<void> {
    try {
      const payment = await this.yooKassa.payment.get(paymentId);

      const order = await this.ordersRepository.findOne({
        where: { paymentId },
        relations: ['user', 'tariff'],
      });

      if (!order) {
        throw new BadRequestException('Order not found');
      }

      if (payment.status === 'succeeded') {
        order.status = 'paid';
        await this.ordersRepository.save(order);

        // Update user subscription if this is a tariff payment
        if (order.type === 'subscription' && order.tariff) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          await this.usersService.updateSubscription(
            order.userId,
            order.tariff.name.toLowerCase(),
            expiresAt,
          );
        }
      } else if (payment.status === 'canceled') {
        order.status = 'cancelled';
        await this.ordersRepository.save(order);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
    }
  }

  async findUserOrders(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: ['tariff'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOrderById(id: string): Promise<Order | null> {
    return this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'tariff'],
    });
  }

  async cancelSubscription(userId: string): Promise<any> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.subscriptionPlan || user.subscriptionPlan === 'free') {
      throw new BadRequestException('User does not have an active subscription');
    }

    // Отмена подписки - устанавливаем план на 'free' и дату на сегодня
    await this.usersService.updateSubscription(userId, 'free', new Date());

    // Создаём запись об отмене (для истории)
    const cancelOrder = this.ordersRepository.create({
      userId,
      status: 'cancelled',
      type: 'subscription',
      description: `Subscription ${user.subscriptionPlan} cancelled by user`,
      amount: 0,
    });

    await this.ordersRepository.save(cancelOrder);

    return {
      message: 'Subscription cancelled successfully',
      previousPlan: user.subscriptionPlan,
      newPlan: 'free',
      cancelledAt: new Date(),
    };
  }
}
