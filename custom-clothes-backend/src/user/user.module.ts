import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import { JwtModule } from '@nestjs/jwt';
import { env } from '../env';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [UserController],
  providers: [UserService, UserEntity],
  exports: [UserEntity, UserService],
})
export class UserModule {}
