import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Repository } from 'typeorm';
import { ProductEntity } from '../models/product.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private productService: Repository<ProductEntity>,
  ) {}
  async create(dto: CreateProductDto, apiKey: any) {
    const decode =
    await this.productService.save(dto);
    return {
      success: true,
    };
  }

  async update(params: any, dto: UpdateProductDto) {
    await this.productService.update(params, dto);
    return {
      success: true,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} shoppingCart`;
  }

  remove(id: number) {
    return `This action removes a #${id} shoppingCart`;
  }
}
