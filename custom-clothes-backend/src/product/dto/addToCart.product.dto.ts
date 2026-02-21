import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddToCartProductDto{
  @IsNotEmpty()
  @IsUUID()
  id: number

  @IsNotEmpty()
  quantity: number
}