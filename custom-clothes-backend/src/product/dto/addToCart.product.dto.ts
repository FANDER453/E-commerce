import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddToCartProductDto{
  @IsNotEmpty()
  @IsUUID()
  id: string

  @IsNotEmpty()
  quantity: number
}