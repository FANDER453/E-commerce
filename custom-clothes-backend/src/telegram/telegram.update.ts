import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import {Context} from "telegraf";
import {Repository} from "typeorm";
import {UserEntity} from "../models/user.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Injectable} from "@nestjs/common";
import jwt from 'jsonwebtoken'

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
        console.log(startMessage)
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
        const user = jwt.verify(apiKey, process.env.ACCESS_KEY!);
        console.log(user)
    }
}