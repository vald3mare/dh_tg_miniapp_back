import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Валидирует подписанные данные от Telegram WebApp
   * Telegram отправляет подписанные initData, нужно проверить подпись
   */
  async validateTelegramData(initData: string, botToken: string): Promise<any> {
    try {
      const data = new URLSearchParams(initData);
      const hash = data.get('hash');
      
      if (!hash) {
        throw new BadRequestException('Telegram hash не найден в initData');
      }

      // Удаляем hash из данных перед проверкой
      data.delete('hash');

      // Сортируем данные по алфавиту и формируем строку для проверки
      const entries = Array.from(data.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join('\n');

      // Создаем HMAC-SHA256 для проверки
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      // Сравниваем хэши
      if (computedHash !== hash) {
        this.logger.warn(`❌ Invalid Telegram hash: expected ${hash}, got ${computedHash}`);
        throw new UnauthorizedException('Telegram signature invalid');
      }

      // Получаем и парсим user данные
      const userJsonStr = data.get('user');
      if (!userJsonStr) {
        throw new BadRequestException('User data не найдены в Telegram initData');
      }

      const userData = JSON.parse(userJsonStr);
      this.logger.debug(`✅ Telegram data validated successfully:`, {
        userId: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
      });

      return userData;
    } catch (error) {
      this.logger.error(`❌ Ошибка при валидации Telegram данных:`, error.message);
      throw error;
    }
  }

  /**
   * Вход или регистрация через Telegram
   * Получает Telegram initData, валидирует её и создает/обновляет пользователя в БД
   */
  async loginOrSignup(initData: string, botToken: string) {
    try {
      this.logger.log('🔐 Начинаем процесс login/signup...');

      // 1️⃣ Валидируем Telegram данные
      const telegramUser = await this.validateTelegramData(initData, botToken);

      // 2️⃣ Находим или создаем пользователя в БД
      this.logger.log(`👤 Ищем или создаем пользователя: ${telegramUser.id}`);
      const user = await this.usersService.findOrCreateByTelegram({
        telegramId: telegramUser.id.toString(),
        firstName: telegramUser.first_name || '',
        lastName: telegramUser.last_name || '',
        username: telegramUser.username || '',
      });

      this.logger.log(`✅ Пользователь найден/создан: ${user.id}`);

      // 3️⃣ Генерируем JWT токен
      const token = this.jwtService.sign(
        {
          userId: user.id,
          telegramId: user.telegramId,
          email: user.email,
        },
        {
          expiresIn: '7d', // Токен действует 7 дней
        },
      );

      this.logger.log(`🎟️  JWT токен сгенерирован для пользователя: ${user.id}`);

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          telegramId: user.telegramId,
          subscriptionPlan: user.subscriptionPlan,
        },
        token,
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка при login/signup:`, error.message);
      throw error;
    }
  }

  /**
   * Валидирует JWT токен
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      this.logger.debug(`✅ Token validated for user: ${payload.userId}`);
      return payload;
    } catch (error) {
      this.logger.warn(`❌ Invalid token: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
