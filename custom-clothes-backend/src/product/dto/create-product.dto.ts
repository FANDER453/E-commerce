import { IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  urlPicture: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  price: number;
}
