import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { CreatePetDto } from './dto/pet.dto';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
  ) {}

  async create(userId: string, createPetDto: CreatePetDto): Promise<Pet> {
    const pet = this.petsRepository.create({
      ...createPetDto,
      userId,
    });
    return this.petsRepository.save(pet);
  }

  async findByUserId(userId: string): Promise<Pet[]> {
    return this.petsRepository.find({
      where: { userId },
    });
  }

  async findById(id: string): Promise<Pet | null> {
    return this.petsRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updatePetDto: Partial<CreatePetDto>): Promise<Pet | null> {
    await this.petsRepository.update(id, updatePetDto);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.petsRepository.delete(id);
  }
}
