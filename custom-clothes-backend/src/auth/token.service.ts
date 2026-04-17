import jwt, { JwtPayload } from 'jsonwebtoken';
import {ConfigService} from "@nestjs/config";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {TokenEntity} from "../models/token.entity";
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { env } from '../env';

@Injectable()
export class TokenService{
    constructor(private readonly configService: ConfigService, @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>) {
    }
    async generateToken(payload: object){
        try {
            // @ts-ignore
          const accessToken = jwt.sign(payload, process.env.ACCESS_KEY, {
              expiresIn: '30m',
            });
            // @ts-ignore
          const refreshToken = jwt.sign(payload, process.env.REFRESH_KEY, {
              expiresIn: '30d',
            });
            return{
                accessToken,
                refreshToken
            }
        }catch (e){
            console.log(e)
        }
    }

    async saveToken(userid, refreshToken){
      const tokenData = await this.tokenRepository.findOne({
        where:{
          userid: userid
        }
      })
      console.log(tokenData)
      if (tokenData){
        tokenData.refreshToken = refreshToken
        return this.tokenRepository.save({
          userid: tokenData.userid,
          refreshToken
        })
      }
      const token = this.tokenRepository.create({
        userid: userid,
        refreshToken
      })
      return this.tokenRepository.save(token)

    }

    async refreshAccessToken (refreshToken){
      // @ts-ignore
      const decode = jwt.verify(refreshToken, process.env.REFRESH_KEY,)
      const {id, email, isActivated, role} = decode
      const payload = {
        id,
        email,
        isActivated,
        role
      }
      console.log('1231');
      return jwt.sign(payload, process.env.ACCESS_KEY!, { expiresIn: '30m' });

    }

    async update(refreshToken: string){
      if(refreshToken === null || refreshToken === undefined){
        throw new HttpException('The cookie is incorrect.', HttpStatus.UNAUTHORIZED)
      }
      const token = await this.tokenRepository.findOneBy({ refreshToken: refreshToken })
      if(token === null){
        throw new HttpException('The cookie is incorrect.', HttpStatus.UNAUTHORIZED)
      }
      return await this.tokenRepository.update(token.userid, {refreshToken: 'null' })
    }


}