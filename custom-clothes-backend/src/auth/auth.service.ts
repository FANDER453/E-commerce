import {ConflictException, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {AuthDto} from "./dto/auth.dto";
import {LoginDto} from "./dto/login.dto";
import bcrypt from "bcrypt";
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import {Repository} from "typeorm";
import {TokenDto} from "./dto/token.dto";
import {TokenService} from "./token.service";

@Injectable()
export class AuthService {
    constructor(
    @InjectRepository(UserEntity)
    private authService: Repository<UserEntity>,
    private readonly tokenService: TokenService ) {
    }
    async registration(dto: AuthDto){
        const {name, email} = dto
        const password = await bcrypt.hash(dto.password, 10)
        const user = this.authService.create({name, password, email})

        const checkUserByEmail = await this.authService.findOneBy({email: user.email})

        const checkUserByUserName = await this.authService.findOneBy({name: user.name})
        if(checkUserByEmail || checkUserByUserName){
            throw new ConflictException('A user with such data already exists.')
        }

        return this.authService.save(user)
    }
    async login(dto: LoginDto){
        const {name, password} = dto
        const user = await this.authService.findOne({
            where:{
                name: name
            }
        })
        if (user === null){
            throw new HttpException('The username is incorrect.', HttpStatus.UNAUTHORIZED)
        }
        console.log(user)
        const hash_password = user?.password
        const isPassword = await bcrypt.compare(password, String(hash_password))
        if (!isPassword){
            throw new HttpException('The password is incorrect.', HttpStatus.UNAUTHORIZED)
        }
        const userDto = new TokenDto(user)
        const payload= {...userDto}
        const token = await this.tokenService.generateToken(payload)
        const accessToken = token?.accessToken
        const refreshToken = token?.refreshToken
        const a = await this.tokenService.saveToken(user.id, refreshToken)
        console.log(a)
        return{
            accessToken,
            refreshToken
        }
    }
}
