import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../models/product.entity';

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forFeature([
    ProductEntity
  ])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
