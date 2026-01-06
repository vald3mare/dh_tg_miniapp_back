import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/pet.dto';

/**
 * Контроллер для управления питомцами пользователей
 * Обрабатывает HTTP запросы для CRUD операций с питомцами
 */
@Controller('pets')
export class PetsController {
  private readonly logger = new Logger(PetsController.name);

  constructor(private readonly petsService: PetsService) {}

  /**
   * POST /pets
   * Создать нового питомца для пользователя
   * @param createPetDto - Данные питомца с userId
   * @returns Созданный питомец
   */
  @Post()
  async create(@Body() createPetDto: CreatePetDto & { userId: string }) {
    try {
      this.logger.log(`📥 POST request: Create new pet`);

      if (!createPetDto.userId) {
        throw new BadRequestException('userId is required');
      }

      this.logger.log(
        `🐕 Pet data:`,
        JSON.stringify(createPetDto),
      );

      const result = await this.petsService.create(
        createPetDto.userId,
        createPetDto,
      );

      this.logger.log(`✅ Pet created successfully with id: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Error creating pet:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * GET /pets/user/:userId
   * Получить всех питомцев пользователя
   * @param userId - UUID владельца
   * @returns Массив питомцев пользователя
   */
  @Get('user/:userId')
  async getUserPets(@Param('userId') userId: string) {
    try {
      this.logger.log(`📥 GET request: Get pets for user ${userId}`);
      const pets = await this.petsService.findByUserId(userId);
      this.logger.log(`✅ Retrieved ${pets.length} pets`);
      return pets;
    } catch (error) {
      this.logger.error(
        `❌ Error getting pets for user ${userId}:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * GET /pets/:id
   * Получить питомца по ID
   * @param id - UUID питомца
   * @returns Данные питомца
   */
  @Get(':id')
  async getPet(@Param('id') id: string) {
    try {
      this.logger.log(`📥 GET request: Get pet with id=${id}`);
      const pet = await this.petsService.findById(id);

      if (!pet) {
        this.logger.warn(`⚠️  Pet ${id} not found`);
        throw new NotFoundException(`Pet with id ${id} not found`);
      }

      return pet;
    } catch (error) {
      this.logger.error(
        `❌ Error getting pet ${id}:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * PUT /pets/:id
   * Обновить данные питомца
   * @param id - UUID питомца
   * @param updatePetDto - Данные для обновления
   * @returns Обновленный питомец
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePetDto: Partial<CreatePetDto>,
  ) {
    try {
      this.logger.log(`📝 PUT request: Update pet with id=${id}`);

      if (!updatePetDto || Object.keys(updatePetDto).length === 0) {
        throw new BadRequestException('No data provided for update');
      }

      this.logger.log(
        `📋 Update data:`,
        JSON.stringify(updatePetDto),
      );

      const result = await this.petsService.update(id, updatePetDto);

      if (!result) {
        this.logger.warn(`⚠️  Pet ${id} not found for update`);
        throw new NotFoundException(`Pet with id ${id} not found`);
      }

      this.logger.log(`✅ Pet ${id} updated successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Error updating pet ${id}:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * DELETE /pets/:id
   * Удалить питомца
   * @param id - UUID питомца
   * @returns Объект с флагом успеха
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      this.logger.log(`📥 DELETE request: Delete pet with id=${id}`);
      await this.petsService.delete(id);
      this.logger.log(`✅ Pet ${id} deleted successfully`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `❌ Error deleting pet ${id}:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }
}
