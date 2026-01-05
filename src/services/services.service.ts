import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const service = this.servicesRepository.create(createServiceDto);
    return this.servicesRepository.save(service);
  }

  async findAll(): Promise<Service[]> {
    return this.servicesRepository.find({
      where: { isActive: true },
    });
  }

  async findById(id: string): Promise<Service | null> {
    return this.servicesRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service | null> {
    await this.servicesRepository.update(id, updateServiceDto);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.servicesRepository.update(id, { isActive: false });
  }
}
