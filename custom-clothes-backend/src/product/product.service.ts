import {HttpException, HttpStatus, Injectable, NotFoundException} from '@nestjs/common';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { Repository } from 'typeorm';
import { ProductEntity } from '../models/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../models/user.entity';
import { CartEntity, CartItem } from '../models/cart.entity';
import { AddToCartProductDto } from './dto/addToCart.product.dto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {OrderEntity} from "../models/order.entity";

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private productService: Repository<ProductEntity>,
    @InjectRepository(CartItem)
    private cartItem: Repository<CartItem>,
    @InjectRepository(CartEntity)
    private cartService: Repository<CartEntity>,
  ) {}
  async create(dto: CreateProductDto, apiKey: any) {
    const { user_id_creator, ...data } = dto;
    console.log({ ...data }, user_id_creator);
    const product = this.productService.create({
      ...data,
      userIdCreator: user_id_creator,
    });
    const decode = await this.productService.save(product);
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

  async get() {
    const products = await this.productService.find();
    const product = products.map((products) => ({
      id: products.id,
      urlPicture: products.urlPicture,
      title: products.title,
      review: products.review,
      grade: products.grade,
      price: products.price,
    }));
    return {
      product,
    };
  }

  async remove(id: string) {
    const product = await this.productService.findOneBy({
      id,
    });
    if (!product) {
      return {
        success: false,
      };
    }
    await this.productService.remove(product);
    return {
      success: true,
    };
  }

  async addToCart(dto: AddToCartProductDto, token: string) {
    const product = await this.productService.findOneBy({
      id: dto.id,
    });

    if (!product) {
      throw new NotFoundException(`Product with ${dto.id} not found`);
    }

    const decode = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload;
    const cart = (await this.cartService.findOne({
      where: { user: { id: decode.id } },
      relations: ['items', 'items.product'],
    })) as CartEntity;

    const item = cart.items.find(item => item.productId === product.id)
    if(item){
        item.quantity += dto.quantity
        if(item.quantity > product.inStock){
            throw new HttpException('The product is out of stock', HttpStatus.BAD_REQUEST)
        }else{
            product.inStock -= item.quantity
            await this.productService.save(product)
            return await this.cartItem.save(item)
        }
    }else{
        const newItem = await this.cartItem.save(this.cartItem.create({
            productId: product.id,
            quantity: dto.quantity,
            cartId: cart.id
        }))
        return newItem
    }


  }
}
