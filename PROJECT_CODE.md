# E-commerce Backend - Полный исходный код

Полная документация исходного кода проекта E-commerce на NestJS.

---

## Содержание

1. [Главные файлы](#главные-файлы)
2. [Auth модуль](#auth-модуль)
3. [Product модуль](#product-модуль)
4. [Order модуль](#order-модуль)
5. [User модуль](#user-модуль)
6. [Telegram модуль](#telegram-модуль)
7. [Guards & Decorators](#guards--decorators)
8. [Models (Entities)](#models-entities)
9. [Enums](#enums)

---

## Главные файлы

### app.controller.ts

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

### app.service.ts

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

### app.module.ts

```typescript
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
import {HttpsProxyAgent} from "https-proxy-agent";
import * as path from 'path';
import {session} from "telegraf";

@Module({
  imports: [
    TelegrafModule.forRoot({
        token: '8765587777:AAF0HhQQWm-6JHMsIU4UEDqrKzSK20XFGiw',
        middlewares: [session()]
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '1111',
      database: process.env.DB_NAME || 'project',
      autoLoadEntities: true,
      //synchronize: true,
      //dropSchema: true,
    }),
    AuthModule,
    UserModule,
    CartEntity,
    ConfigModule.forRoot({
      envFilePath: path.join(process.cwd(), '.env'),
      isGlobal: true
    }),
    ProductModule,
    OrderModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationMetadata} from "class-validator/types/metadata/ValidationMetadata";
import {ValidationPipe} from "@nestjs/common";
import cookieParser from 'cookie-parser';
import 'dotenv/config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser())
  app.setGlobalPrefix('/api')
  app.enableCors({
    origin: true,
    credentials: true,
  })
  app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
  )
  console.log(process.env.PORT);
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
```

### env.ts

```typescript
const getEnv = (name: string) => {
  console.log(process.env.ACCESS_KEY)
  const value = process.env[name]
  
  if(!value){
    return "Error"
  }
  
  return value
}

export const env = {
  JWT_SECRET_ACCESS: getEnv('ACCESS_KEY'),
  JWT_SECRET_REFRESH: getEnv("REFRESH_KEY"),
};
```

---

## Auth модуль

### auth.controller.ts

```typescript
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '../guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registration')
  async registration(@Body() dto: AuthDto, @Res() res: express.Response) {
    const userEntity = await this.authService.registration(dto);
    const { user, token } = userEntity;
    const accessToken = token?.accessToken;
    const refreshToken = token?.refreshToken
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
    });
    res.json({
      success: true,
      accessToken: accessToken,
      id: user.id,
      email: user.email,
    });
  }

  @Get('activation/:link')
  async activate(@Param() prams: any, @Res() res: express.Response){
    const link = this.authService.activate(prams.link);
    const redirectUrl:any = process.env.REDIRECT_URL;
    res.redirect(redirectUrl);
  }
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const UserEntity = await this.authService.login(dto);

    res.cookie('refreshToken', UserEntity.refreshToken, {
      httpOnly: true,
    });
    res.json({
      success: true,
      accessToken: UserEntity.accessToken,
      id: UserEntity.user.id,
      email: UserEntity.user.email,
    });
  }
  @Post('/refresh')
  async refresh(@Req() req: express.Request) {
    const refreshToken = req.cookies.refreshToken;
    const token = await this.authService.refresh(refreshToken);
    return {
      success: true,
      accessToken: token,
    };
  }

}
```

### auth.service.ts

```typescript
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
import {CartEntity} from "../models/cart.entity";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private authService: Repository<UserEntity>,
        private readonly tokenService: TokenService,
        private readonly mailService: MailService,
        @InjectRepository(CartEntity)
        private cartService: Repository<CartEntity>
    ) {}
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
        const cart = await this.cartService.create({user: {id: user.id}})
        await this.cartService.save(cart)
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
```

### auth.module.ts

```typescript
import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {ConfigModule} from "@nestjs/config";
import {UserEntity} from "../models/user.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import {TokenService} from "./token.service";
import {TokenEntity} from "../models/token.entity";
import { MailService } from './mail.service';
import { AuthGuard } from '../guards/auth.guard';
import {CartEntity} from "../models/cart.entity";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TokenEntity,
      CartEntity
    ]),
    ConfigModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, MailService, AuthGuard],
  exports: [TokenService, AuthGuard, TypeOrmModule]
})
export class AuthModule {}
```

### token.service.ts

```typescript
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
```

### mail.service.ts

```typescript
import nodemailer from 'nodemailer'
export class MailService{
  async mailSend(email, link){
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_SEND,
        pass: process.env.MAIL_PASSWORD
      }
    })
    let mailOptions = {
      from: 'testserverlogin1111@gmail.com',
      to: email,
      html:
        `
          <div>
            <h1>Activation account</h1>
            <a href="${link}">${link}</a>
          </div>>
        `
    };
    transporter.sendMail(mailOptions, (err) => {
      if(err){
        console.error(err)
      }
    })

  }
}
```

### Auth DTOs

#### auth.dto.ts

```typescript
import {IsEmail, IsNotEmpty, MinLength} from "class-validator";

export class AuthDto{
    @IsNotEmpty()
    name: string;

    @MinLength(6)
    password: string;

    @IsNotEmpty()
    @IsEmail({
        require_tld: true
    })
    email: string;
}
```

#### login.dto.ts

```typescript
import {IsNotEmpty, MinLength} from "class-validator";

export class LoginDto{
    @IsNotEmpty()
    name: string;

    @MinLength(6)
    password: string;
}
```

#### token.dto.ts

```typescript
export class TokenDto{
    id: string;
    name: string;
    email: string;
    role: string;
    isActivated: string;

    constructor(model) {
        this.id = model.id;
        this.name = model.name
        this.email = model.email;
        this.isActivated = model.isActivated
        this.role = model.role
    }
}
```

---

## Product модуль

### product.controller.ts

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { RolesGuard } from '../guards/role.guard';
import { Role } from '../enums/role.enum';
import { Roles } from '../decorator/role.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { AddToCartProductDto } from './dto/addToCart.product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly shoppingCartService: ProductService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Post('/create')
  @Roles(Role.ADMIN)
  async create(
    @Body() createShoppingCartDto: CreateProductDto,
    @Headers('Authorization') unParsedApiKey: any,
  ) {
    const apiKey = unParsedApiKey.split(' ')[1];
    return await this.shoppingCartService.create(createShoppingCartDto, apiKey);
  }

  @UseGuards(AuthGuard)
  @Post('add-to-cart')
  async addToCart(
    @Body() addToCartDto: AddToCartProductDto,
    @Headers('Authorization' ) unParsedApiKey: any
  ){
    const apiKey = unParsedApiKey.split(' ')[1];
    return await this.shoppingCartService.addToCart(addToCartDto, apiKey);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('update/:id')
  async update(
    @Param() params: any,
    @Body() updateShoppingCartDto: UpdateProductDto,
  ) {
    return await this.shoppingCartService.update(params.id, updateShoppingCartDto);
  }

  @Get()
  async get() {
    return await this.shoppingCartService.get();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.shoppingCartService.remove(id);
  }
}
```

### product.service.ts

```typescript
import {HttpException, HttpStatus, Injectable, NotFoundException} from '@nestjs/common';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { Repository } from 'typeorm';
import { ProductEntity } from '../models/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../models/user.entity';
import { CartEntity, CartItem } from '../models/cart.entity';
import { AddToCartProductDto } from './dto/addToCart.product.dto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {OrderEntity} from "../models/order.entity";

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private productService: Repository<ProductEntity>,
    @InjectRepository(CartItem)
    private cartItem: Repository<CartItem>,
    @InjectRepository(CartEntity)
    private cartService: Repository<CartEntity>,
  ) {}
  async create(dto: CreateProductDto, apiKey: any) {
    const { user_id_creator, ...data } = dto;
    console.log({ ...data }, user_id_creator);
    const product = this.productService.create({
      ...data,
      userIdCreator: user_id_creator,
    });
    const decode = await this.productService.save(product);
    return {
      success: true,
    };
  }

  async update(params: any, dto: UpdateProductDto) {
    await this.productService.update(params, dto);
    return {
      success: true,
    };
  }

  async get() {
    const products = await this.productService.find();
    const product = products.map((products) => ({
      id: products.id,
      urlPicture: products.urlPicture,
      title: products.title,
      review: products.review,
      grade: products.grade,
      price: products.price,
    }));
    return {
      product,
    };
  }

  async remove(id: string) {
    const product = await this.productService.findOneBy({
      id,
    });
    if (!product) {
      return {
        success: false,
      };
    }
    await this.productService.remove(product);
    return {
      success: true,
    };
  }

  async addToCart(dto: AddToCartProductDto, token: string) {
    const product = await this.productService.findOneBy({
      id: dto.id,
    });

    if (!product) {
      throw new NotFoundException(`Product with ${dto.id} not found`);
    }

    const decode = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload;
    const cart = (await this.cartService.findOne({
      where: { user: { id: decode.id } },
      relations: ['items', 'items.product'],
    })) as CartEntity;

    const item = cart.items.find(item => item.productId === product.id)
    if(item){
        item.quantity += dto.quantity
        if(item.quantity > product.inStock){
            throw new HttpException('The product is out of stock', HttpStatus.BAD_REQUEST)
        }else{
            product.inStock -= item.quantity
            await this.productService.save(product)
            return await this.cartItem.save(item)
        }
    }else{
        const newItem = await this.cartItem.save(this.cartItem.create({
            productId: product.id,
            quantity: dto.quantity,
            cartId: cart.id
        }))
        return newItem
    }


  }
}
```

### product.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../models/product.entity';
import { CartEntity, CartItem } from '../models/cart.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([ProductEntity, CartEntity, CartItem]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
```

### Product DTOs

#### create.product.dto.ts

```typescript
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  urlPicture: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  price: number;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  material: string;

  @IsNotEmpty()
  dimensions: string;

  @IsNotEmpty()
  inStock: number;

  @IsUUID()
  @IsOptional()
  user_id_creator: string;
}
```

#### update.product.dto.ts

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create.product.dto';
import {IsEmpty, IsNotEmpty, IsOptional} from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
    @IsOptional()
    urlPicture: string;

    @IsOptional()
    price: number;

    @IsOptional()
    inStock: number

    @IsOptional()
    dimensions: string


}
```

#### addToCart.product.dto.ts

```typescript
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddToCartProductDto{
  @IsNotEmpty()
  @IsUUID()
  id: string

  @IsNotEmpty()
  quantity: number
}
```

---

## Order модуль

### order.controller.ts

```typescript
import { Body, Controller, Post, UseGuards, Headers } from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { OrderItemDto } from './dto/order.dto';
import { OrderGuard } from 'src/guards/order.guard';
import jwt from 'jsonwebtoken'


@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AuthGuard)//, OrderGuard)
  @Post()
  async order(
    @Headers('Authorization') unParsedApiKey: any
  ){
    const decode = await jwt.verify(unParsedApiKey.split(' ')[1], process.env.ACCESS_KEY!)
    return this.orderService.order(decode)
  }

}
```

### order.service.ts

```typescript
import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {CartEntity, CartItem} from 'src/models/cart.entity';
import {OrderEntity, OrderItem} from 'src/models/order.entity';
import {UserEntity} from 'src/models/user.entity';
import {Repository} from "typeorm";
import {OrderStatus} from "../enums/order.enum";

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private orderService: Repository<OrderEntity>,
    @InjectRepository(OrderItem)
    private orderItemService: Repository<OrderItem>,
    @InjectRepository(UserEntity)
    private authService: Repository<UserEntity>,
    @InjectRepository(CartEntity)
    private cartService: Repository<CartEntity>,
    @InjectRepository(CartItem)
    private cartItemService: Repository<CartItem>,
  ) {}

  async order(decodeApiKey) {
    console.log(decodeApiKey);
    const user = await this.authService.findOneBy({ id: decodeApiKey.id });
    const cart = await this.cartService.findOne({
        where: {
            user: { id: user?.id },
        },
        relations: ['items', 'items.product'],
    });
    const totalPrice = cart?.items.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
    }, 0);
    const order = await this.orderService.save(
        this.orderService.create({
            user: { id: user?.id },
            orderPrice: totalPrice,
            status: OrderStatus.PENDING
        }),
    );
    cart?.items.map(async (item) => {
        const orderItem = this.orderItemService.create({
            title: item.product.title,
            quantity: item.quantity,
            price: item.product.price,
            product: item.product,
            order: order,
        });
        await this.orderItemService.save(orderItem);
    });
    await this.cartItemService.delete({cart: {id: cart?.id}})
  }
}
```

### order.module.ts

```typescript
import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OrderEntity, OrderItem } from 'src/models/order.entity';
import { UserEntity } from 'src/models/user.entity';
import { CartEntity, CartItem } from 'src/models/cart.entity';
import { ProductEntity } from 'src/models/product.entity';

@Module({
  imports:[
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([OrderEntity, UserEntity, CartEntity, CartItem, OrderItem])],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
```

### Order DTO

#### order.dto.ts

```typescript
import { IsNotEmpty } from "class-validator";

export class OrderItemDto{
    @IsNotEmpty()
    productId: object

    @IsNotEmpty()
    quantity: string
}
```

---

## User модуль

### user.controller.ts

```typescript
import {
  Body,
  Controller,
  Get,
  Headers, Param, Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import {Repository} from "typeorm";
import { AuthGuard } from '../guards/auth.guard';
import { JwtPayload } from 'jsonwebtoken';
import express from 'express';
import { UserChangePasswordDto } from './dto/user.changePassword.dto';
import { UserUpdateNameDto } from './dto/user.updateName.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('/profile')
  async getProfile(@Headers('Authorization') apiKey: string) {
    const token = apiKey?.split(' ')[1];
    const user = await this.userService.getUser(token)
    //console.log(user)
    return {
        name: user?.name,
        email: user?.email,
        isActivated: user?.isActivated,
        cart: user?.carts,
        order: user?.orders
    };
  }

  @UseGuards(AuthGuard)
  @Patch('/updateProfile')
  async update(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
    @Body() dto: UserUpdateNameDto,
  ) {
    const token = req.headers.authorization?.split(' ')[1] as string;
    return await this.userService.update(dto, token);
  }
  @UseGuards(AuthGuard)
  @Patch('/updateProfile/changePassword')
  async change(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
    @Body() dto: UserChangePasswordDto,
  ) {
    const token = req.headers.authorization?.split(' ')[1] as string;
    return await this.userService.change(dto, token);
  }

  @UseGuards(AuthGuard)
  @Get('/cart')
  async getCart(@Req() req: any) {
    const userId = req.user.id
    console.log(userId)
    return this.userService.getCart(userId)
  }
  @UseGuards(AuthGuard)
  @Post('/logout')
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    console.log(refreshToken);
    await this.userService.logout(refreshToken);
    res.clearCookie('refreshToken');
    return {
      success: true,
    };
  }
}
```

### user.service.ts

```typescript
import {ConflictException, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import {Repository} from "typeorm";
import bcrypt from 'bcrypt'
import {AuthDto} from "../auth/dto/auth.dto";
import { LoginDto } from '../auth/dto/login.dto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { TokenService } from '../auth/token.service';
import { UserChangePasswordDto } from './dto/user.changePassword.dto';
import { UserUpdateNameDto } from './dto/user.updateName.dto';
import * as querystring from 'node:querystring';
import { CartEntity } from '../models/cart.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userService: Repository<UserEntity>,
    private readonly tokenService: TokenService,
    @InjectRepository(CartEntity)
    private cartService: Repository<CartEntity>
  ) {}
  async getUser(token: string) {
    const decode = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload;
    const user = await this.userService.findOne({
        where:{
            id: decode.id
        },
        relations: ['carts', 'orders', "carts.items"]
    })
    return user
  }
  async change(dto: UserChangePasswordDto, token: string) {
    const { oldPassword, newPassword, confirmNewPassword } = dto;
    const decode = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload;
    const user = (await this.userService.findOneBy({
      name: decode.name,
    })) as UserEntity;
    const isOldPassword = (await bcrypt.compare(
      oldPassword,
      user.password,
    )) as boolean;
    if (!isOldPassword) {
      throw new HttpException(
        { message: 'Password incorrect', success: false },
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (newPassword !== confirmNewPassword) {
      throw new HttpException(
        { message: 'The passwords entered are not the same', success: false },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const hash = (await bcrypt.hash(confirmNewPassword, 12)) as string;
    await this.userService.update(decode.id, { password: hash });
    return {
      success: true,
    };
  }
  async update(dto: UserUpdateNameDto, token: string) {
    const decode = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload;
    if (dto.email === undefined) {
      await this.userService.update(decode.id, { name: dto.name });
      const user = (await this.userService.findOneBy({
        name: dto.name,
      })) as UserEntity;
      return {
        success: true,
        name: user.name,
      };
    } else if (dto.name === undefined) {
      await this.userService.update(decode.id, { email: dto.email });
      const user = (await this.userService.findOneBy({
        email: dto.email,
      })) as UserEntity;
      return {
        success: true,
        email: user.email,
      };
    } else if (
      typeof dto.name !== undefined &&
      typeof dto.email !== undefined
    ) {
      await this.userService.update(decode.id, {
        email: dto.email,
        name: dto.name,
      });
      const user = (await this.userService.findOneBy({
        email: dto.email,
        name: dto.name,
      })) as UserEntity;
      return {
        success: true,
        name: user.name,
        email: user.email,
      };
    }
  }
  async getCart(userId: string) {
    return await this.cartService.find({
      where: {user: {id: userId}},
      relations: ['items']
    })
  }
  async logout(refreshToken: string) {
    await this.tokenService.update(refreshToken);
    return {
      success: true,
    };
  }
}
```

### user.module.ts

```typescript
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import { JwtModule } from '@nestjs/jwt';
import { env } from '../env';
import { TokenService } from '../auth/token.service';
import { TokenEntity } from '../models/token.entity';
import { ConfigModule } from '@nestjs/config';
import { ProductEntity } from '../models/product.entity';
import { ProductService } from '../product/product.service';
import { AuthModule } from '../auth/auth.module';
import { CartEntity } from '../models/cart.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      CartEntity
    ]),
    AuthModule,
    ConfigModule.forRoot(),
  ],
  controllers: [UserController],
  providers: [
    UserService
  ],
  exports: [UserService],
})
export class UserModule {}
```

### User DTOs

#### user.updateName.dto.ts

```typescript
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class UserUpdateNameDto {
  @IsOptional()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
```

#### user.changePassword.dto.ts

```typescript
import { IsNotEmpty, Length, min, MinLength } from 'class-validator';

export class UserChangePasswordDto {
  @IsNotEmpty()
  @MinLength(6)
  oldPassword: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;

  @IsNotEmpty()
  @MinLength(6)
  confirmNewPassword: string;
}
```

---

## Telegram модуль

### telegram.controller.ts

```typescript
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
```

### telegram.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TelegramService, TelegramUpdate } from './telegram.update';
import {TypeOrmModule} from "@nestjs/typeorm";
import {UserEntity} from "../models/user.entity";
import {ConfigModule} from "@nestjs/config";
import {TelegramController} from "./telegram.controller";
import {CartEntity, CartItem} from "../models/cart.entity";
import {ProductEntity} from "../models/product.entity";
import {OrderEntity, OrderItem} from "../models/order.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CartEntity, ProductEntity, CartItem, OrderEntity, OrderItem]), ConfigModule.forRoot()],
  providers: [TelegramUpdate, TelegramService],
  controllers: [TelegramController],
})
export class TelegramModule {}
```

### telegram.update.ts (excerpt)

```typescript
constructor(
    @InjectRepository(UserEntity)
    private userService: Repository<UserEntity>,
) {}
```

---

## Guards & Decorators

### role.decorator.ts

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

### auth.guard.ts

```typescript
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { UserEntity } from '../models/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private userEntity: Repository<UserEntity>
  ) {
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as any;
    const reqToken = request.headers['authorization'];
    if (!reqToken || !reqToken.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = reqToken.split(' ')[1];
    try {
      const payload = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload;
      const user = await this.userEntity.findOneBy({id: payload.id}) as UserEntity
      if(!user){
        throw new UnauthorizedException()
      }
      request.user = payload;
      return request.user;
    } catch (e) {
      if (e instanceof TokenExpiredError){
        throw new UnauthorizedException();
      }else if(e instanceof UnauthorizedException){
        throw new UnauthorizedException()
      }
      console.log(e)
      return false
    }

  }
}
```

### order.guard.ts

```typescript
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { UserEntity } from "src/models/user.entity";
import { Repository } from "typeorm";
@Injectable()
export class OrderGuard implements CanActivate {

    constructor(@InjectRepository(UserEntity) private userEntity: Repository<UserEntity>){}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest() as any;
        const reqToken = request.headers['authorization'];
        if (!reqToken || !reqToken.startsWith('Bearer ')) {
            throw new UnauthorizedException();
        }
        try{
            const token = reqToken.split(' ')[1];
            const decode = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload
            const user = await this.userEntity.findOne({
                where:{
                    id: decode.id
                }
            })
            if(user?.carts === undefined){
                throw new HttpException({ message: 'Cart not found', success: false }, HttpStatus.BAD_REQUEST)
            }else{
                request.user = user;
                return request.user;
            }
        }
        
        catch (e) {
             if (e instanceof TokenExpiredError || e instanceof HttpException || e instanceof UnauthorizedException) {
                throw e;
            }
            console.log(e)
            return false
        }
    }
}
```

### role.guard.ts

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/role.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    // if (!requiredRoles) {
    //   return true;
    // }
    const { user } = context.switchToHttp().getRequest();
    const isAdmin = requiredRoles.some((role) => user.role?.includes(role));
    console.log(isAdmin)
    if(isAdmin){
      return true
    }else{
      return false;
    }

  }
}
```

---

## Models (Entities)

### user.entity.ts

```typescript
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from './user.role';
import { ProductEntity } from './product.entity';
import { CartEntity } from './cart.entity';
import { OrderEntity } from './order.entity';

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({default: null, type: "bigint"})
    telegramId: bigint

    @Column({default: null, nullable: true})
    telegramLinkToken: string

    @Column({default: null})
    telegramLinked: boolean

    @Column({ unique: true })
    name: string;

    @Column()
    password: string;

    @Column({ unique: true })
    email: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.ADMIN,
    })
    role: UserRole;

    @Column({ default: false })
    isActivated: boolean;

    @Column({ default: 'null' })
    linkActivated: string;

    @OneToMany(() => ProductEntity, (product) => product.userId)
    products: ProductEntity[];

    @OneToMany(() => CartEntity, (cart) => cart.user)
    carts: CartEntity[];

    @OneToMany(() => OrderEntity, (order) => order.user)
    orders: OrderEntity[]
}
```

### user.role.ts

```typescript
export enum UserRole{
    ADMIN = 'admin',
    USER = 'user'
}
```

### product.entity.ts

```typescript
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { CartEntity, CartItem } from './cart.entity';
import {OrderItem} from "./order.entity";

@Entity('product')
export class ProductEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    urlPicture: string;

    @Column({ nullable: false })
    title: string;

    @Column({ nullable: true })
    review: number;

    @Column({ nullable: true })
    grade: number;

    @Column({ nullable: false })
    price: number;

    @Column({nullable: false})
    description: string //описание

    @Column({nullable: false})
    material: string

    @Column({nullable: false})
    dimensions: string //размер

    @Column({nullable: false})
    inStock: number

    @Column({ name: 'user_id_creator', type: 'uuid', nullable: true })
    userIdCreator: string;

    @ManyToOne(() => UserEntity, (user) => user.products, { nullable: true })
    @JoinColumn({ name: 'user_id_creator' })
    userId: UserEntity;

    @OneToMany(() => CartItem, (item) => item.product)
    cart: CartEntity[];

  @OneToMany(() => OrderItem, (item) => item.product)
  order: OrderItem[];
}
```

### cart.entity.ts

```typescript
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { ProductEntity } from './product.entity';
import { OrderEntity } from './order.entity';

@Entity('cart')
export class CartEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    userId: string

    @ManyToOne(() => UserEntity, (user) => user.carts)
    @JoinColumn({ name: 'userId' })
    user: UserEntity

    @OneToMany(() => CartItem, (item) => item.cart)
    items: CartItem[]

}

@Entity('cartItem')
export class CartItem{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    quantity: number

    @Column()
    productId: string

    @Column()
    cartId: string

    @ManyToOne(() => ProductEntity, (product) => product.cart)
    @JoinColumn({name: 'productId'})
    product: ProductEntity

    @ManyToOne(() => CartEntity, (cart) => cart.items)
    @JoinColumn({name: 'cartId'})
    cart: CartEntity

}
```

### order.entity.ts

```typescript
import { OrderStatus } from 'src/enums/order.enum';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { CartEntity } from './cart.entity';
import { ProductEntity } from './product.entity';
import { UserEntity } from './user.entity';
@Entity('order')
export class OrderEntity{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ 
        nullable: false,
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING
     })
    status: OrderStatus

    @Column()
    orderPrice: number

    @Column()
    userId: string

    @ManyToOne(() => UserEntity, (user) => user.orders)
    @JoinColumn({name: 'userId'})
    user: UserEntity

    @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
    items: OrderItem[]

}
@Entity('orderItem')
export class OrderItem{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    quantity: number

    @Column()
    title: string

    @Column()
    price: number

    @Column()
    productId: string

    @ManyToOne(() => ProductEntity, (item) => item.order)
    @JoinColumn({name: 'productId'})
    product: ProductEntity

    @Column()
    orderId: string

    @ManyToOne(() => OrderEntity, (item) => item.items)
    @JoinColumn({name: 'orderId'})
    order: OrderEntity
}
```

### token.entity.ts

```typescript
import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity('token')
export class TokenEntity {
    @PrimaryGeneratedColumn('uuid')
    userid: number;

    @Column({unique: true, type: 'varchar', length: 500})
    refreshToken: string;
}
```

---

## Enums

### role.enum.ts

```typescript
export enum Role {
  USER = 'user',
  ADMIN = 'admin'
}
```

### order.enum.ts

```typescript
export enum OrderStatus{
    PENDING = 'В ожидании подтверждения',
    CONFIRMED = 'Подтверждён продавцом',
    PAID = 'Оплачен',
    PACKING = 'Собирается',
    SHIPPED = 'Отправлен',
    DELIVERING = 'Доставлен',
    CANCELLED = 'Отменён',
    REFUNDED = 'Возврат денег',
}
```

---

## Резюме проекта

Это полный исхо��ный код **E-commerce приложения на NestJS** с поддержкой:

- ✅ **Аутентификация и авторизация** (регистрация, логин, JWT токены, refresh tokens)
- ✅ **Управление товарами** (создание, обновление, удаление товаров)
- ✅ **Корзина покупок** (добавление товаров в корзину)
- ✅ **Заказы** (создание и управление заказами)
- ✅ **Профиль пользователя** (обновление данных, смена пароля)
- ✅ **Интеграция с Telegram** (подключение Telegram бота)
- ✅ **Роли и права доступа** (Admin, User)
- ✅ **Email верификация** (отправка писем для активации аккаунта)
- ✅ **MySQL база данных** (через TypeORM)
- ✅ **CORS и валидация данных** (class-validator)

Проект готов к использованию и развитию!
