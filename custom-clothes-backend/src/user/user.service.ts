import {ConflictException, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import {Repository} from "typeorm";
import bcrypt from 'bcrypt'
import {AuthDto} from "../auth/dto/auth.dto";
import { LoginDto } from '../auth/dto/login.dto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { TokenService } from '../auth/token.service';
import { UserChangePasswordDto } from './dto/user.changePassword.dto';
import { UserUpdateNameDto } from './dto/user.updateName.dto';
import * as querystring from 'node:querystring';
import { CartEntity } from '../models/cart.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userService: Repository<UserEntity>,
    private readonly tokenService: TokenService,
    @InjectRepository(CartEntity)
    private cartService: Repository<CartEntity>
  ) {}
  async getUser(token: string) {
    const decode = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload;
    return { decode };
  }
  async change(dto: UserChangePasswordDto, token: string) {
    const { oldPassword, newPassword, confirmNewPassword } = dto;
    const decode = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload;
    const user = (await this.userService.findOneBy({
      name: decode.name,
    })) as UserEntity;
    const isOldPassword = (await bcrypt.compare(
      oldPassword,
      user.password,
    )) as boolean;
    if (!isOldPassword) {
      throw new HttpException(
        { message: 'Password incorrect', success: false },
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (newPassword !== confirmNewPassword) {
      throw new HttpException(
        { message: 'The passwords entered are not the same', success: false },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const hash = (await bcrypt.hash(confirmNewPassword, 12)) as string;
    await this.userService.update(decode.id, { password: hash });
    return {
      success: true,
    };
  }
  async update(dto: UserUpdateNameDto, token: string) {
    const decode = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload;
    if (dto.email === undefined) {
      await this.userService.update(decode.id, { name: dto.name });
      const user = (await this.userService.findOneBy({
        name: dto.name,
      })) as UserEntity;
      return {
        success: true,
        name: user.name,
      };
    } else if (dto.name === undefined) {
      await this.userService.update(decode.id, { email: dto.email });
      const user = (await this.userService.findOneBy({
        email: dto.email,
      })) as UserEntity;
      return {
        success: true,
        email: user.email,
      };
    } else if (
      typeof dto.name !== undefined &&
      typeof dto.email !== undefined
    ) {
      await this.userService.update(decode.id, {
        email: dto.email,
        name: dto.name,
      });
      const user = (await this.userService.findOneBy({
        email: dto.email,
        name: dto.name,
      })) as UserEntity;
      return {
        success: true,
        name: user.name,
        email: user.email,
      };
    }
  }
  async getCart(userId: string) {
    return await this.cartService.find({
      where: {user: {id: userId}},
      relations: ['items']
    })
  }
  async logout(refreshToken: string) {
    await this.tokenService.update(refreshToken);
    return {
      success: true,
    };
  }
}