import { Controller, Get, Put, Body, Param, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      this.logger.log(`📝 Updating user ${id} with data:`, JSON.stringify(updateUserDto));
      const result = await this.usersService.update(id, updateUserDto);
      this.logger.log(`✅ User ${id} updated successfully`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error updating user ${id}:`, error.message, error.stack);
      throw error;
    }
  }
}
