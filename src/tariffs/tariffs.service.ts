import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tariff } from './entities/tariff.entity';
import { CreateTariffDto, UpdateTariffDto } from './dto/tariff.dto';

@Injectable()
export class TariffsService {
  constructor(
    @InjectRepository(Tariff)
    private tariffsRepository: Repository<Tariff>,
  ) {}

  async create(createTariffDto: CreateTariffDto): Promise<Tariff> {
    const tariff = this.tariffsRepository.create(createTariffDto);
    return this.tariffsRepository.save(tariff);
  }

  async findAll(): Promise<Tariff[]> {
    return this.tariffsRepository.find({
      where: { isActive: true },
      order: { monthlyPrice: 'ASC' },
    });
  }

  async findById(id: string): Promise<Tariff | null> {
    return this.tariffsRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateTariffDto: UpdateTariffDto): Promise<Tariff | null> {
    await this.tariffsRepository.update(id, updateTariffDto);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.tariffsRepository.update(id, { isActive: false });
  }
}
