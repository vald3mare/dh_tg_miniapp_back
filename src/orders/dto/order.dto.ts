export class CreateOrderDto {
  tariffId?: string;
  serviceId?: string;
  amount: number;
  description?: string;
}

export class OrderDto {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  type: string;
  tariffId?: string;
  serviceId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
