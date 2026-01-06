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
  firstName?: string;  // Добавлен firstname для обновления имени
  lastName?: string;   // Добавлен lastname для обновления фамилии
  phoneNumber?: string;
  email?: string;
}
