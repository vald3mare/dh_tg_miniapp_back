export class ServiceDto {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  basePrice: number;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
}

export class CreateServiceDto {
  title: string;
  description: string;
  fullDescription?: string;
  basePrice: number;
  icon?: string;
}

export class UpdateServiceDto {
  title?: string;
  description?: string;
  fullDescription?: string;
  basePrice?: number;
  icon?: string;
  isActive?: boolean;
}
