import { Ctx, On, Start, Update, Action } from 'nestjs-telegraf';
import {Context, Markup} from "telegraf";
import {Repository} from "typeorm";
import {UserEntity} from "../models/user.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Injectable} from "@nestjs/common";
import jwt, {JwtPayload} from 'jsonwebtoken'
import uuid from 'uuid'
import {type} from "node:os";
import {CartEntity} from "../models/cart.entity";
import {ProductEntity} from "../models/product.entity";

@Update()
export class TelegramUpdate{
    constructor(
        @InjectRepository(UserEntity)
        private userService: Repository<UserEntity>,
        @InjectRepository(CartEntity)
        private cartService: Repository<CartEntity>,
        @InjectRepository(ProductEntity)
        private productService: Repository<ProductEntity>

    ) {}
    @Start()
    async start(@Ctx() ctx: Context){

        // @ts-ignore
        const startMessage = (ctx.message.text).split(' ')[1]
        if(startMessage){
            const user = await this.userService.findOne({
                where:{
                    telegramLinkToken: startMessage
                }
            }) as UserEntity
            user.telegramLinkToken = 'null'
            if (ctx.from?.id != null) {
                user.telegramId = BigInt(ctx.from?.id)
                console.log(typeof user.telegramId)
            }
            user.telegramLinked = true
            await this.userService.save(user)
            await ctx.reply('✅ Аккаунт успешно привязан!\\n\\nТеперь вам доступны все функции магазина прямо здесь, в Telegram.\n\nИспользуйте меню ниже для навигации по разделам:',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('👕 Товары', 'product')],
                        [
                            Markup.button.callback('👤 Профиль', 'profile'),
                            Markup.button.callback('🛒 Корзина', 'cart')
                        ],
                        [
                            Markup.button.callback('📦 Заказы', 'order'),
                            Markup.button.callback('🆘 Поддержка', 'support')
                        ],
                        [
                            Markup.button.url('📺 Канал Shizo', 'https://t.me/customandshizo'),
                            Markup.button.callback('ℹ️ О нас', 'aboutUs')
                        ]
                    ])
                }
            )
        }else {
            if(ctx.from?.id == null){
                return false
            }
            const user = await this.userService.findOne({
                where: {
                    telegramId: BigInt(ctx.from?.id)
                }
            })
            console.log(user)
            if(user === null){
                //await ctx.replyWithPhoto({source: 'C:\\Users\\sn1f1r\\Pictures\\Annotation 2026-03-02 200447.png'}, {caption: 'Registration on official site'})

                await ctx.reply('У вас не привязан Телеграм', Markup.inlineKeyboard([
                    [
                        Markup.button.url('Привязать', `${process.env.APP_URL}/telegram/connect`),
                        Markup.button.callback('Поддержка', 'support'),
                    ]
                ]))
            }else{
                await ctx.reply('👋 *Добро пожаловать в Телеграм бота ShizoShop!*\n\nИспользуйте меню ниже для навигации по разделам:',
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('👕 Товары', 'product')],
                            [
                                Markup.button.callback('👤 Профиль', 'profile'),
                                Markup.button.callback('🛒 Корзина', 'cart')
                            ],
                            [
                                Markup.button.callback('📦 Заказы', 'order'),
                                Markup.button.callback('🆘 Поддержка', 'support')
                            ],
                            [
                                Markup.button.url('📺 Канал Shizo', 'https://t.me/customandshizo'),
                                Markup.button.callback('ℹ️ О нас', 'aboutUs')
                            ]
                        ])
                    }
                )
            }
        }

    }
    @Action('profile')
    async profile(@Ctx() ctx: Context){
        const user = await this.userService.findOne({
            where:{
                telegramId: BigInt(ctx.from!.id)
            }, relations: ['carts', 'orders']
        })
        const message = `
        👤 *Ваш профиль*
        
🆔 **ID:** \`${user!.id}\`
🏷 **Имя:** ${user!.name || 'Не указано'}
📧 **Email:** ${user!.email || 'Не привязан'}
🛒 **Товаров в корзине:** ${user!.carts?.length || 0}
📦 **Всего заказов:** ${user!.orders?.length || 0}`
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Назад', 'back_to_menu')]
            ])
        })
    }
    @Action('cart')
    async cart(@Ctx() ctx: Context){
        const user = await this.userService.findOne({
            where:{
                telegramId: BigInt(ctx.from!.id)
            }
        })
        const cart = await this.cartService.findOne({
            where:{
                userId: user?.id
            }, relations: ['items', 'items.product']
        })
        const cartItem = cart?.items.map((item) => {
            return `🆔 **ID Товара:** ${item.id} \n 🏷 **Название товара: ** ${item.product.title} \n 📦 **Количество: ** ${item.quantity}`;
        }).join(`\n\n`)
        const message = `
        🛒 **Ваша корзина:**
        \n${cartItem}
        `
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🚚 Заказать', 'order')],
                [Markup.button.callback('⬅️ Назад', 'back_to_menu')]
            ])
        })
    }

    @Action('back_to_menu')
    async backToMenu(@Ctx() ctx: Context){
        await ctx.editMessageText('👋 *Добро пожаловать в Телеграм бота ShizoShop!*\n\nИспользуйте меню ниже для навигации по разделам:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('👕 Товары', 'product')],
                    [
                        Markup.button.callback('👤 Профиль', 'profile'),
                        Markup.button.callback('🛒 Корзина', 'cart')
                    ],
                    [
                        Markup.button.callback('📦 Заказы', 'order'),
                        Markup.button.callback('🆘 Поддержка', 'support')
                    ],
                    [
                        Markup.button.url('📺 Канал Shizo', 'https://t.me/customandshizo'),
                        Markup.button.callback('ℹ️ О нас', 'aboutUs')
                    ]
                ])
            }
        )
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

        if(user.telegramLinkToken === 'null'){
            return {message: 'Your telegram have been connect'}
        }
        user.telegramLinkToken = token
        console.log(user)
        await this.userService.save(user)
        return {"token": `https://t.me/shizo_shop_bot?start=${token}`}
    }
}