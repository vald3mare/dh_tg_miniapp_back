import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOrCreateByTelegram(createUserDto: CreateUserDto): Promise<User> {
    let user = await this.usersRepository.findOne({
      where: { telegramId: createUserDto.telegramId },
    });

    if (!user) {
      user = this.usersRepository.create(createUserDto);
      user = await this.usersRepository.save(user);
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['pets', 'orders'],
    });
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { telegramId },
      relations: ['pets', 'orders'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    await this.usersRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async updateSubscription(id: string, plan: string, expiresAt: Date): Promise<User | null> {
    await this.usersRepository.update(id, {
      subscriptionPlan: plan as any,
      subscriptionExpiresAt: expiresAt,
    });
    return this.findById(id);
  }
}
