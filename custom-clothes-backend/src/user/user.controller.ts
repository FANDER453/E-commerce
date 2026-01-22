import { Controller, Get, Headers } from '@nestjs/common';
import { UserService } from './user.service';
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import {Repository} from "typeorm";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('/profile')
  async getProfile(@Headers('Authorization') apiKey: string) {
    const token = apiKey?.split(' ')[1]
    const user = await this.userService.getUser(token);
    return{
      name: user.decode.name,
      email: user.decode.email,
      isActivated: user.decode.isActivated
    }
  }
}
