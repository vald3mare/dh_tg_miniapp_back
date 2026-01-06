import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger('AuthController');

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  /**
   * POST /auth/login
   * Вход через Telegram - получает initData и возвращает JWT токен
   *
   * @param body.initData - подписанные данные от Telegram WebApp (window.Telegram.WebApp.initData)
   * @returns { user: { id, firstName, lastName, email, telegramId, subscriptionPlan }, token: string }
   *
   * Сценарий:
   * 1. Фронтенд отправляет window.Telegram.WebApp.initData
   * 2. Бэкенд валидирует подпись используя TELEGRAM_BOT_TOKEN
   * 3. Если валидна - извлекаем user.id, name и другие данные
   * 4. Находим или создаем пользователя в БД
   * 5. Возвращаем JWT токен и данные пользователя
   */
  @Post('login')
  async login(@Body() body: { initData: string }) {
    try {
      if (!body.initData) {
        throw new Error('initData не предоставлена');
      }

      this.logger.log('🔐 Получен запрос login с initData');

      const botToken = this.configService.get('TELEGRAM_BOT_TOKEN') || 'YOUR_BOT_TOKEN';
      if (botToken === 'YOUR_BOT_TOKEN') {
        this.logger.warn('⚠️  TELEGRAM_BOT_TOKEN не установлен в переменных окружения');
      }

      const result = await this.authService.loginOrSignup(body.initData, botToken);
      
      this.logger.log(`✅ Login успешен для пользователя: ${result.user.id}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Ошибка при login:`, error.message);
      throw error;
    }
  }

  /**
   * POST /auth/validate
   * Валидирует JWT токен
   *
   * @param body.token - JWT токен
   * @returns { userId, telegramId, email, iat, exp }
   */
  @Post('validate')
  async validate(@Body() body: { token: string }) {
    try {
      if (!body.token) {
        throw new Error('Token не предоставлен');
      }

      this.logger.log('🔍 Валидируем токен...');
      const payload = await this.authService.validateToken(body.token);
      
      this.logger.log(`✅ Токен валиден для пользователя: ${payload.userId}`);
      return payload;
    } catch (error) {
      this.logger.error(`❌ Ошибка при валидации токена:`, error.message);
      throw error;
    }
  }
}
