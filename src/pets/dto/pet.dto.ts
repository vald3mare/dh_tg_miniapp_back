export class CreatePetDto {
  name: string;
  breed: string;
  age: number;
  description?: string;
}

export class PetDto {
  id: string;
  name: string;
  breed: string;
  age: number;
  description?: string;
  photoUrl?: string;
  createdAt: Date;
}
