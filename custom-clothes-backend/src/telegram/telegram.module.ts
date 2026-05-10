import { Module } from '@nestjs/common';
import { TelegramService, TelegramUpdate } from './telegram.update';
import {TypeOrmModule} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import {ConfigModule} from "@nestjs/config";
import {TelegramController} from "./telegram.controller";
import {CartEntity} from "../models/cart.entity";
import {ProductEntity} from "../models/product.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CartEntity, ProductEntity]), ConfigModule.forRoot()],
  providers: [TelegramUpdate, TelegramService],
  controllers: [TelegramController],
})
export class TelegramModule {}
