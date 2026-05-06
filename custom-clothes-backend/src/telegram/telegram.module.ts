import { Module } from '@nestjs/common';
import { TelegramService, TelegramUpdate } from './telegram.update';
import {TypeOrmModule} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import {ConfigModule} from "@nestjs/config";
import {TelegramController} from "./telegram.controller";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ConfigModule.forRoot()],
  providers: [TelegramUpdate, TelegramService],
  controllers: [TelegramController],
})
export class TelegramModule {}
