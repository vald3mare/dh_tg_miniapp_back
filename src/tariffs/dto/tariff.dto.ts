export class TariffDto {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  createdAt: Date;
}

export class CreateTariffDto {
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
  isPopular?: boolean;
}

export class UpdateTariffDto {
  name?: string;
  description?: string;
  monthlyPrice?: number;
  features?: string[];
  isPopular?: boolean;
  isActive?: boolean;
}
