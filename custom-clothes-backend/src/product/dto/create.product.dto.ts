import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  urlPicture: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  price: number;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  material: string;

  @IsNotEmpty()
  dimensions: string;

  @IsNotEmpty()
  inStock: number;

  @IsUUID()
  @IsOptional()
  user_id_creator: string;
}
