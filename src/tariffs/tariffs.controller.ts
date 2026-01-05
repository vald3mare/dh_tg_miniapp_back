import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { TariffsService } from './tariffs.service';
import { CreateTariffDto, UpdateTariffDto } from './dto/tariff.dto';

@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get()
  async getAllTariffs() {
    return this.tariffsService.findAll();
  }

  @Get(':id')
  async getTariff(@Param('id') id: string) {
    return this.tariffsService.findById(id);
  }

  @Post()
  async create(@Body() createTariffDto: CreateTariffDto) {
    return this.tariffsService.create(createTariffDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTariffDto: UpdateTariffDto) {
    return this.tariffsService.update(id, updateTariffDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.tariffsService.delete(id);
    return { success: true };
  }
}
