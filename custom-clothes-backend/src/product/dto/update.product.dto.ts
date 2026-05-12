import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create.product.dto';
import {IsEmpty, IsNotEmpty, IsOptional} from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
    @IsOptional()
    urlPicture: string;

    @IsOptional()
    price: number;

    @IsOptional()
    inStock: number

    @IsOptional()
    dimensions: string


}

