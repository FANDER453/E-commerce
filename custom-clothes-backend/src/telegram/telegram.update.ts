import { Ctx, Start, Update } from 'nestjs-telegraf';
import {Context} from "telegraf";

@Update()
export class TelegramUpdate{
    @Start()
    async start(@Ctx() ctx: Context){
        await ctx.reply('hi')
    }
}