import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

/**
 * Сервис для управления пользователями
 * Отвечает за CRUD операции с пользователями в БД
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Создать нового пользователя или получить существующего
   * Используется при первом входе через Telegram
   * @param createUserDto - Данные для создания пользователя
   * @returns User - Созданный или существующий пользователь
   */
  async findOrCreateByTelegram(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Пытаемся найти существующего пользователя по telegramId
      let user = await this.usersRepository.findOne({
        where: { telegramId: createUserDto.telegramId },
      });

      // Если пользователь не существует - создаем нового
      if (!user) {
        this.logger.log(
          `👤 Creating new user with telegramId: ${createUserDto.telegramId}`,
        );
        user = this.usersRepository.create(createUserDto);
        user = await this.usersRepository.save(user);
        this.logger.log(`✅ User created successfully with id: ${user.id}`);
      } else {
        this.logger.log(
          `✅ User already exists with id: ${user.id}`,
        );
      }

      return user;
    } catch (error) {
      this.logger.error(
        `❌ Error in findOrCreateByTelegram: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Получить пользователя по ID
   * @param id - UUID пользователя
   * @returns User с связанными питомцами и заказами, или null
   */
  async findById(id: string): Promise<User | null> {
    try {
      // Валидация UUID формата
      if (!this.isValidUuid(id)) {
        throw new BadRequestException(`Invalid UUID format: ${id}`);
      }

      this.logger.log(`🔍 Finding user by id: ${id}`);
      const user = await this.usersRepository.findOne({
        where: { id },
        relations: ['pets', 'orders'],
      });

      if (!user) {
        this.logger.warn(`⚠️  User not found with id: ${id}`);
        return null;
      }

      this.logger.log(`✅ User found: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `❌ Error in findById: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Получить пользователя по Telegram ID
   * @param telegramId - ID пользователя в Telegram
   * @returns User с связанными питомцами и заказами
   */
  async findByTelegramId(telegramId: string): Promise<User | null> {
    try {
      this.logger.log(`🔍 Finding user by telegramId: ${telegramId}`);
      const user = await this.usersRepository.findOne({
        where: { telegramId },
        relations: ['pets', 'orders'],
      });

      if (!user) {
        this.logger.warn(`⚠️  User not found with telegramId: ${telegramId}`);
        return null;
      }

      this.logger.log(`✅ User found: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `❌ Error in findByTelegramId: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Обновить данные профиля пользователя
   * ВАЖНО: Обновляет только изменяемые поля (firstName, lastName, email, phoneNumber)
   * @param id - UUID пользователя
   * @param updateUserDto - Данные для обновления
   * @returns Обновленный пользователь или null если не найден
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    try {
      // Валидация UUID формата
      if (!this.isValidUuid(id)) {
        throw new BadRequestException(`Invalid UUID format: ${id}`);
      }

      this.logger.log(`🔍 Looking for user ${id} to update`);

      // Проверяем что пользователь существует
      const user = await this.usersRepository.findOne({ where: { id } });

      if (!user) {
        this.logger.warn(`⚠️  User ${id} not found for update`);
        return null;
      }

      // Логируем какие поля обновляются
      this.logger.log(
        `📝 Updating user ${id} with data:`,
        JSON.stringify(updateUserDto),
      );

      // Выполняем обновление
      await this.usersRepository.update(id, updateUserDto);

      // Возвращаем обновленного пользователя
      const updated = await this.findById(id);
      this.logger.log(`✅ User ${id} updated successfully`);
      return updated;
    } catch (error) {
      this.logger.error(
        `❌ Error in update method for user ${id}:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Обновить информацию о подписке пользователя
   * Используется при успешной оплате
   * @param id - UUID пользователя
   * @param plan - Новый план подписки
   * @param expiresAt - Дата окончания подписки
   * @returns Обновленный пользователь
   */
  async updateSubscription(
    id: string,
    plan: string,
    expiresAt: Date,
  ): Promise<User | null> {
    try {
      if (!this.isValidUuid(id)) {
        throw new BadRequestException(`Invalid UUID format: ${id}`);
      }

      this.logger.log(
        `💳 Updating subscription for user ${id}: plan=${plan}, expires=${expiresAt}`,
      );

      await this.usersRepository.update(id, {
        subscriptionPlan: plan as any,
        subscriptionExpiresAt: expiresAt,
      });

      const updated = await this.findById(id);
      this.logger.log(`✅ Subscription updated for user ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(
        `❌ Error updating subscription for user ${id}:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Создать или обновить пользователя
   * Используется когда фронтенд отправляет ID которого еще нет в БД
   * Создает нового пользователя с этим ID и данными из updateUserDto
   * @param id - UUID пользователя
   * @param updateUserDto - Данные для создания/обновления
   * @returns Созданный или обновленный пользователь
   */
  async createOrUpdate(
    id: string,
    updateUserDto: any,
  ): Promise<User> {
    try {
      if (!this.isValidUuid(id)) {
        throw new BadRequestException(`Invalid UUID format: ${id}`);
      }

      this.logger.log(`👤 Creating new user with id ${id}`);

      // Создаем новое пользователя с указанным ID
      let user = await this.usersRepository.findOne({ where: { id } });

      if (!user) {
        user = this.usersRepository.create({
          id,
          firstName: updateUserDto.firstName || '',
          lastName: updateUserDto.lastName || '',
          email: updateUserDto.email || '',
          phoneNumber: updateUserDto.phoneNumber || '',
          subscriptionPlan: 'free',
        });
        user = await this.usersRepository.save(user);
        this.logger.log(`✅ New user created with id ${id}`);
      } else {
        // Если пользователь вдруг существует - обновляем его
        Object.assign(user, updateUserDto);
        user = await this.usersRepository.save(user);
        this.logger.log(`✅ Existing user updated: ${id}`);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `❌ Error in createOrUpdate for user ${id}:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Вспомогательный метод для валидации UUID
   * @param uuid - Строка для проверки
   * @returns true если корректный UUID формат
   */
  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
