import {ConflictException, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import {Repository} from "typeorm";
import bcrypt from 'bcrypt'
import {AuthDto} from "../auth/dto/auth.dto";
import {LoginDto} from "../auth/dto/login.dto";

@Injectable()
export class UserService {
    constructor() {}


}
