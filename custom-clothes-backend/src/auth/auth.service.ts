import {ConflictException, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {AuthDto} from "./dto/auth.dto";
import {LoginDto} from "./dto/login.dto";
import bcrypt from "bcrypt";
import {InjectRepository} from "@nestjs/typeorm";
import { v4, v4 as uuid } from 'uuid';
import {UserEntity} from "../models/user.entity";
import {Repository} from "typeorm";
import {TokenDto} from "./dto/token.dto";
import {TokenService} from "./token.service";
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
    constructor(
    @InjectRepository(UserEntity)
    private authService: Repository<UserEntity>,
    private readonly tokenService: TokenService, private readonly mailService: MailService) {
    }
    async registration(dto: AuthDto){
        const { name, email } = dto;
        const checkUserByEmail = await this.authService.findOneBy({
          email,
        });

        const checkUserByUserName = await this.authService.findOneBy({
          name,
        });
        if (checkUserByEmail || checkUserByUserName) {
          throw new ConflictException('A user with such data already exists.');
        }

        const password = await bcrypt.hash(dto.password, 10)
        const linkActivated = v4();
        await this.mailService.mailSend(
          email,
          `${process.env.URL}/auth/activation/${linkActivated}`,
        );
        const user = this.authService.create({name, password, email, linkActivated})
        const userSaved = await this.authService.save(user);
        const userDto = new TokenDto(userSaved);
        const payload = {...userDto}
        const token = await this.tokenService.generateToken(payload);
        await this.tokenService.saveToken(user.id, token?.refreshToken);
        console.log(user)
        return {user: userSaved, token: token}
    }

    async activate(link){
      const user = await this.authService.findOneBy({ linkActivated: link });
      if(!user){
        return{
          success: true,
          message: 'invalid activation link'
        }
      }
      user.isActivated = true
      user.linkActivated = 'null'
      await this.authService.save(user)
      return {
        success: true
      }

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
            user,
            accessToken,
            refreshToken
        }
    }
    async refresh(refreshToken: string){
        return await this.tokenService.refreshAccessToken(refreshToken)
    }
}
