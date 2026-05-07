import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import {Context} from "telegraf";
import {Repository} from "typeorm";
import {UserEntity} from "../models/user.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Injectable} from "@nestjs/common";
import jwt, {JwtPayload} from 'jsonwebtoken'
import uuid from 'uuid'

@Update()
export class TelegramUpdate{
    constructor(
        @InjectRepository(UserEntity)
        private userService: Repository<UserEntity>
    ) {}
    @Start()
    async start(@Ctx() ctx: Context){
        await ctx.reply('hi')
        // @ts-ignore
        const startMessage = (ctx.message.text).split(' ')[1]
        const user = await this.userService.findOne({
            where:{
                telegramLinkToken: startMessage
            }
        }) as UserEntity
        user.telegramLinkToken = 'null'
        if (ctx.from?.id != null) {
            user.telegramId = ctx.from?.id
        }
        user.telegramLinked = true
        console.log(user)
    }

    @On('message')
    async onMessage(@Ctx() ctx: Context){
        //const tgId = ctx.from.id;
    }
}

@Injectable()
export class TelegramService {
    constructor(
        @InjectRepository(UserEntity)
        private userService: Repository<UserEntity>,
    ) {}
    async getTelegramKey(unParsApiKey) {
        const apiKey = unParsApiKey.split(' ')[1]
        const userApi = jwt.verify(apiKey, process.env.ACCESS_KEY!) as JwtPayload
        const token = uuid.v4()
        const user =  await this.userService.findOne({
            where:{
                id: userApi.id
            }
        }) as UserEntity
        user.telegramLinkToken = token
        console.log(user)
        await this.userService.save(user)
        return {"token": `https://t.me/shizo_shop_bot?start=${token}`}

    }
}