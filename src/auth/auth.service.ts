import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateTelegramData(initData: string, botToken: string): Promise<any> {
    const data = new URLSearchParams(initData);
    const hash = data.get('hash');
    
    if (!hash) {
      throw new UnauthorizedException('No hash provided');
    }

    // Remove hash from data
    data.delete('hash');

    // Sort and stringify the data
    const entries = Array.from(data.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join('\n');

    // Create HMAC
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (computedHash !== hash) {
      throw new UnauthorizedException('Invalid hash');
    }

    // Parse user data
    const userJsonStr = data.get('user');
    if (!userJsonStr) {
      throw new UnauthorizedException('No user data');
    }

    return JSON.parse(userJsonStr);
  }

  async loginOrSignup(telegramUser: any, botToken: string) {
    // Validate telegram data
    const userData = await this.validateTelegramData(telegramUser.initData, botToken);

    // Find or create user
    const user = await this.usersService.findOrCreateByTelegram({
      telegramId: userData.id.toString(),
      firstName: userData.first_name,
      lastName: userData.last_name,
      username: userData.username,
    });

    // Generate JWT token
    const token = this.jwtService.sign({
      userId: user.id,
      telegramId: user.telegramId,
      email: user.email,
    });

    return {
      user,
      token,
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
