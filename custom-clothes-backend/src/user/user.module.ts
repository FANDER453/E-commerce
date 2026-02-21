import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import { JwtModule } from '@nestjs/jwt';
import { env } from '../env';
import { TokenService } from '../auth/token.service';
import { TokenEntity } from '../models/token.entity';
import { ConfigModule } from '@nestjs/config';
import { ProductEntity } from '../models/product.entity';
import { ProductService } from '../product/product.service';
import { AuthModule } from '../auth/auth.module';
import { CartEntity } from '../models/cart.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      CartEntity
    ]),
    AuthModule,
    ConfigModule.forRoot(),
  ],
  controllers: [UserController],
  providers: [
    UserService
  ],
  exports: [UserService],
})
export class UserModule {}
