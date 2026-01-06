import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { CreatePetDto } from './dto/pet.dto';

/**
 * Сервис для управления питомцами пользователей
 * Отвечает за CRUD операции с питомцами в БД
 */
@Injectable()
export class PetsService {
  private readonly logger = new Logger(PetsService.name);

  constructor(
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
  ) {}

  /**
   * Создать нового питомца для пользователя
   * @param userId - UUID владельца питомца
   * @param createPetDto - Данные питомца (name, breed, age, description)
   * @returns Созданный питомец
   */
  async create(userId: string, createPetDto: CreatePetDto): Promise<Pet> {
    try {
      // Валидация UUID
      if (!this.isValidUuid(userId)) {
        throw new BadRequestException(`Invalid userId UUID format: ${userId}`);
      }

      // Валидация обязательных полей
      if (!createPetDto.name || !createPetDto.breed || !createPetDto.age) {
        throw new BadRequestException(
          'Pet must have name, breed, and age',
        );
      }

      this.logger.log(
        `🐕 Creating pet for user ${userId}:`,
        JSON.stringify(createPetDto),
      );

      // Создаем объект питомца с userId
      const pet = this.petsRepository.create({
        ...createPetDto,
        userId,
      });

      // Сохраняем в БД
      const savedPet = await this.petsRepository.save(pet);
      this.logger.log(`✅ Pet created successfully with id: ${savedPet.id}`);
      return savedPet;
    } catch (error) {
      this.logger.error(
        `❌ Error creating pet for user ${userId}:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Получить всех питомцев пользователя
   * @param userId - UUID владельца
   * @returns Массив питомцев пользователя
   */
  async findByUserId(userId: string): Promise<Pet[]> {
    try {
      if (!this.isValidUuid(userId)) {
        throw new BadRequestException(`Invalid userId UUID format: ${userId}`);
      }

      this.logger.log(`🔍 Finding pets for user ${userId}`);
      const pets = await this.petsRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`✅ Found ${pets.length} pets for user ${userId}`);
      return pets;
    } catch (error) {
      this.logger.error(
        `❌ Error finding pets for user ${userId}:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Получить питомца по ID
   * @param id - UUID питомца
   * @returns Данные питомца или null
   */
  async findById(id: string): Promise<Pet | null> {
    try {
      if (!this.isValidUuid(id)) {
        throw new BadRequestException(`Invalid pet id UUID format: ${id}`);
      }

      this.logger.log(`🔍 Finding pet by id: ${id}`);
      const pet = await this.petsRepository.findOne({
        where: { id },
      });

      if (!pet) {
        this.logger.warn(`⚠️  Pet ${id} not found`);
        return null;
      }

      return pet;
    } catch (error) {
      this.logger.error(
        `❌ Error finding pet ${id}:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Обновить данные питомца
   * @param id - UUID питомца
   * @param updatePetDto - Данные для обновления
   * @returns Обновленный питомец или null
   */
  async update(
    id: string,
    updatePetDto: Partial<CreatePetDto>,
  ): Promise<Pet | null> {
    try {
      if (!this.isValidUuid(id)) {
        throw new BadRequestException(`Invalid pet id UUID format: ${id}`);
      }

      this.logger.log(
        `🔍 Looking for pet ${id} to update`,
      );

      // Проверяем что питомец существует
      const pet = await this.findById(id);
      if (!pet) {
        this.logger.warn(`⚠️  Pet ${id} not found for update`);
        return null;
      }

      this.logger.log(
        `📝 Updating pet ${id}:`,
        JSON.stringify(updatePetDto),
      );

      // Выполняем обновление
      await this.petsRepository.update(id, updatePetDto);

      // Возвращаем обновленного питомца
      const updated = await this.findById(id);
      this.logger.log(`✅ Pet ${id} updated successfully`);
      return updated;
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
   * Удалить питомца
   * @param id - UUID питомца
   */
  async delete(id: string): Promise<void> {
    try {
      if (!this.isValidUuid(id)) {
        throw new BadRequestException(`Invalid pet id UUID format: ${id}`);
      }

      this.logger.log(`🗑️  Deleting pet ${id}`);

      // Проверяем что питомец существует
      const pet = await this.findById(id);
      if (!pet) {
        this.logger.warn(`⚠️  Pet ${id} not found for deletion`);
        throw new NotFoundException(`Pet with id ${id} not found`);
      }

      // Удаляем питомца
      await this.petsRepository.delete(id);
      this.logger.log(`✅ Pet ${id} deleted successfully`);
    } catch (error) {
      this.logger.error(
        `❌ Error deleting pet ${id}:`,
        error.message,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Вспомогательный метод для валидации UUID
   * @param uuid - Строка для проверки
   * @returns true если корректный UUID формат
   */
  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
