import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('login')
  async login(@Body() body: { initData: string }) {
    const botToken = this.configService.get('TELEGRAM_BOT_TOKEN') || 'YOUR_BOT_TOKEN';
    return this.authService.loginOrSignup({ initData: body.initData }, botToken);
  }

  @Post('validate')
  async validate(@Body() body: { token: string }) {
    return this.authService.validateToken(body.token);
  }
}
