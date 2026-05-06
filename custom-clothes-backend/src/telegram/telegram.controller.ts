import {Controller, Get, UseGuards, Headers} from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import {TelegramService} from "./telegram.update";

@Controller()
export class TelegramController{
    constructor(private readonly tgService: TelegramService) {}
    @UseGuards(AuthGuard)
    @Get('/id')
    async getTelegramId(@Headers('Authorisation') apikey){
        await this.tgService.getTelegramKey(apikey)
    }
}