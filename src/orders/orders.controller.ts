import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('create-payment')
  async createPayment(
    @Body() createOrderDto: CreateOrderDto & { userId: string },
  ) {
    return this.ordersService.createPayment(createOrderDto.userId, createOrderDto);
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    const paymentId = payload.object?.id;
    if (paymentId) {
      await this.ordersService.handleWebhook(paymentId);
    }
    return { status: 'ok' };
  }

  @Delete('cancel-subscription/:userId')
  async cancelSubscription(@Param('userId') userId: string) {
    return this.ordersService.cancelSubscription(userId);
  }

  @Get('user/:userId')
  async getUserOrders(@Param('userId') userId: string) {
    return this.ordersService.findUserOrders(userId);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.findOrderById(id);
  }
}
