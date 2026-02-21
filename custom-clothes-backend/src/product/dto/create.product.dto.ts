import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  urlPicture: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  price: number;

  @IsUUID()
  @IsOptional()
  user_id_creator: string;
}
