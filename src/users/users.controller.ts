import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';

/**
 * Контроллер для управления пользователями
 * Обрабатывает HTTP запросы для получения и обновления профиля
 */
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/:id
   * Получить полные данные профиля пользователя
   * Если пользователь не найден - вернет 404
   * @param id - UUID пользователя
   * @returns Данные пользователя с питомцами и заказами
   */
  @Get(':id')
  async getUser(@Param('id') id: string) {
    try {
      this.logger.log(`📥 GET request: Get user profile with id=${id}`);
      
      const user = await this.usersService.findById(id);

      if (!user) {
        this.logger.warn(`⚠️  User ${id} not found`);
        throw new NotFoundException(`User with id ${id} not found`);
      }

      this.logger.log(`✅ User profile retrieved successfully`);
      return user;
    } catch (error) {
      this.logger.error(
        `❌ Error in getUser (${id}):`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * PUT /users/:id
   * Обновить данные профиля пользователя
   * ВАЖНО: Если пользователя нет в БД - автоматически создает нового
   * Принимает только поля: firstName, lastName, email, phoneNumber
   * @param id - UUID пользователя
   * @param updateUserDto - Данные для обновления
   * @returns Обновленные данные пользователя
   */
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      this.logger.log(`📝 PUT request: Update user with id=${id}`);
      
      // Валидация что тело запроса не пусто
      if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
        throw new BadRequestException('No data provided for update');
      }

      this.logger.log(
        `📋 Update data:`,
        JSON.stringify(updateUserDto),
      );

      // Сначала пытаемся обновить существующего пользователя
      let result = await this.usersService.update(id, updateUserDto);

      // Если пользователя нет - создаем нового с этими данными
      if (!result) {
        this.logger.log(`👤 User ${id} not found, creating new user...`);
        result = await this.usersService.createOrUpdate(id, updateUserDto);
        this.logger.log(`✅ New user created: ${id}`);
      } else {
        this.logger.log(`✅ User ${id} updated successfully`);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `❌ Error in updateUser (${id}):`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }
}
