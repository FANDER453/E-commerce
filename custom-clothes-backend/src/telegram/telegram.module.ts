import { Module } from '@nestjs/common';
import {TelegramUpdate} from "./telegram.update";
import {TelegrafModule} from "nestjs-telegraf";

@Module({
  providers: [TelegramUpdate],
})
export class TelegramModule {}
