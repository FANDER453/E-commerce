import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  urlPicture: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  price: number;

  @IsUUID()
  user_id_creator: string;
}
