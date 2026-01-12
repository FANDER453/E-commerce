import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import {Repository} from "typeorm";

@Controller('user')
export class UserController {

}
