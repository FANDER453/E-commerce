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
  async create(dto: CreateProductDto) {
    const { urlPicture, title, price } = dto;
    await this.productService.save({ urlPicture, price, title });

  }

  findAll() {
    return `This action returns all shoppingCart`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shoppingCart`;
  }

  update(id: number, updateShoppingCartDto: UpdateProductDto) {
    return `This action updates a #${id} shoppingCart`;
  }

  remove(id: number) {
    return `This action removes a #${id} shoppingCart`;
  }
}
