import jwt from 'jsonwebtoken'
import {ConfigService} from "@nestjs/config";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {TokenEntity} from "../models/token.entity";

export class TokenService{
    constructor(private readonly configService: ConfigService, @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>) {
    }
    async generateToken(payload: object){
        try {
            const accessToken = jwt.sign(payload, process.env.ACCESS_KEY, {expiresIn: "30m"})
            const refreshToken = jwt.sign(payload, process.env.REFRESH_KEY, {expiresIn: "30d"})
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


}