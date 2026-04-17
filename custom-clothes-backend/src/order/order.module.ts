import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OrderEntity} from 'src/models/order.entity';
import { UserEntity } from 'src/models/user.entity';
import { CartEntity } from 'src/models/cart.entity';
import { ProductEntity } from 'src/models/product.entity';

@Module({
  imports:[
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([OrderEntity, UserEntity, CartEntity, ProductEntity]),],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
