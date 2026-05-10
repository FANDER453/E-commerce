import {Controller, Get, UseGuards, Headers} from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import {TelegramService} from "./telegram.update";

@Controller('telegram')
export class TelegramController{
    constructor(private readonly tgService: TelegramService) {}
    @UseGuards(AuthGuard)
    @Get('/connect')
    async getTelegramId(@Headers('Authorization') apikey: any){
        return await this.tgService.getTelegramKey(apikey)
    }
}