import { IsNotEmpty } from "class-validator";

export class OrderItemDto{
    @IsNotEmpty()
    productId: object

    @IsNotEmpty()
    quantity: string
}