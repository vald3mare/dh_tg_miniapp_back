export class UserDto {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  phoneNumber?: string;
  email?: string;
  subscriptionPlan: string;
  subscriptionExpiresAt?: Date;
  createdAt: Date;
}

export class CreateUserDto {
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
}

export class UpdateUserDto {
  phoneNumber?: string;
  email?: string;
}
