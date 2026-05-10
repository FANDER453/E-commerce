import {
  Body,
  Controller,
  Get,
  Headers, Param, Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import {Repository} from "typeorm";
import { AuthGuard } from '../guards/auth.guard';
import { JwtPayload } from 'jsonwebtoken';
import express from 'express';
import { UserChangePasswordDto } from './dto/user.changePassword.dto';
import { UserUpdateNameDto } from './dto/user.updateName.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('/profile')
  async getProfile(@Headers('Authorization') apiKey: string) {
    const token = apiKey?.split(' ')[1];
    const user = await this.userService.getUser(token)
    //console.log(user)
    return {
        name: user?.name,
        email: user?.email,
        isActivated: user?.isActivated,
        cart: user?.carts,
        order: user?.orders
    };
  }

  @UseGuards(AuthGuard)
  @Patch('/updateProfile')
  async update(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
    @Body() dto: UserUpdateNameDto,
  ) {
    const token = req.headers.authorization?.split(' ')[1] as string;
    return await this.userService.update(dto, token);
  }
  @UseGuards(AuthGuard)
  @Patch('/updateProfile/changePassword')
  async change(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
    @Body() dto: UserChangePasswordDto,
  ) {
    const token = req.headers.authorization?.split(' ')[1] as string;
    return await this.userService.change(dto, token);
  }

  @UseGuards(AuthGuard)
  @Get('/cart')
  async getCart(@Req() req: any) {
    const userId = req.user.id
    console.log(userId)
    return this.userService.getCart(userId)
  }
  @UseGuards(AuthGuard)
  @Post('/logout')
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    console.log(refreshToken);
    await this.userService.logout(refreshToken);
    res.clearCookie('refreshToken');
    return {
      success: true,
    };
  }
}

