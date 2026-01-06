import { Controller, Get, Post, Put, Delete, Body, Param, Logger } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/pet.dto';

@Controller('pets')
export class PetsController {
  private readonly logger = new Logger(PetsController.name);

  constructor(private readonly petsService: PetsService) {}

  @Post()
  async create(@Body() createPetDto: CreatePetDto & { userId: string }) {
    try {
      this.logger.log(`📝 Creating pet for user ${createPetDto.userId}:`, JSON.stringify(createPetDto));
      const result = await this.petsService.create(createPetDto.userId, createPetDto);
      this.logger.log(`✅ Pet created successfully`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error creating pet:`, error.message, error.stack);
      throw error;
    }
  }

  @Get('user/:userId')
  async getUserPets(@Param('userId') userId: string) {
    return this.petsService.findByUserId(userId);
  }

  @Get(':id')
  async getPet(@Param('id') id: string) {
    return this.petsService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePetDto: Partial<CreatePetDto>) {
    try {
      this.logger.log(`📝 Updating pet ${id}:`, JSON.stringify(updatePetDto));
      const result = await this.petsService.update(id, updatePetDto);
      this.logger.log(`✅ Pet ${id} updated successfully`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error updating pet ${id}:`, error.message, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      this.logger.log(`🗑️  Deleting pet ${id}`);
      await this.petsService.delete(id);
      this.logger.log(`✅ Pet ${id} deleted successfully`);
      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Error deleting pet ${id}:`, error.message, error.stack);
      throw error;
    }
  }
}
