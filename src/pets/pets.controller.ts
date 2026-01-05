import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/pet.dto';

@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  async create(@Body() createPetDto: CreatePetDto & { userId: string }) {
    return this.petsService.create(createPetDto.userId, createPetDto);
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
    return this.petsService.update(id, updatePetDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.petsService.delete(id);
    return { success: true };
  }
}
