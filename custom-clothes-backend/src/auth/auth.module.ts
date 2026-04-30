import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {ConfigModule} from "@nestjs/config";
import {UserEntity} from "../models/user.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import {TokenService} from "./token.service";
import {TokenEntity} from "../models/token.entity";
import { MailService } from './mail.service';
import { AuthGuard } from '../guards/auth.guard';
import {CartEntity} from "../models/cart.entity";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TokenEntity,
      CartEntity
    ]),
    ConfigModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, MailService, AuthGuard],
  exports: [TokenService, AuthGuard, TypeOrmModule]
})
export class AuthModule {}
