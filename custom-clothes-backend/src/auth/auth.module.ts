import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {ConfigModule} from "@nestjs/config";
import {UserEntity} from "../models/user.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import {TokenService} from "./token.service";
import {TokenEntity} from "../models/token.entity";
@Module({
  imports: [
      TypeOrmModule.forFeature([UserEntity, TokenService, TokenEntity]),
      ConfigModule.forRoot()
  ],
  controllers: [AuthController],
  providers: [AuthService, UserEntity, TokenService, TokenEntity],
})
export class AuthModule {}
