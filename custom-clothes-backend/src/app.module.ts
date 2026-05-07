import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import {TypeOrmModule} from "@nestjs/typeorm";
import { UserModule } from './user/user.module';
import {ConfigModule} from "@nestjs/config";
import { ProductModule } from './product/product.module';
import { CartEntity } from './models/cart.entity';
import { OrderModule } from './order/order.module';
import { TelegramModule } from './telegram/telegram.module';
import {TelegrafModule} from "nestjs-telegraf";

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: '8765587777:AAF0HhQQWm-6JHMsIU4UEDqrKzSK20XFGiw',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '1111',
      database: process.env.DB_NAME || 'project',
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: true,
    }),
    AuthModule,
    UserModule,
    CartEntity,
    ConfigModule.forRoot({
      envFilePath:
        'C:\\Users\\sn1f1r\\WebstormProjects\\E-commerce\\custom-clothes-backend\\.env',
    }),
    ProductModule,
    OrderModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
