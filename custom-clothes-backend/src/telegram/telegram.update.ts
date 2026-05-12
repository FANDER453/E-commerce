import { Ctx, On, Start, Update, Action } from 'nestjs-telegraf';
import {Context, Markup} from "telegraf";
import {Repository} from "typeorm";
import {UserEntity} from "../models/user.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import jwt, {JwtPayload} from 'jsonwebtoken'
import uuid from 'uuid'
import {type} from "node:os";
import {CartEntity, CartItem} from "../models/cart.entity";
import {ProductEntity} from "../models/product.entity";

@Update()
export class TelegramUpdate{
    constructor(
        @InjectRepository(UserEntity)
        private userService: Repository<UserEntity>,
        @InjectRepository(CartEntity)
        private cartService: Repository<CartEntity>,
        @InjectRepository(ProductEntity)
        private productService: Repository<ProductEntity>,
        @InjectRepository(CartItem)
        private cartItem: Repository<CartItem>

    ) {}
    private async mainMenu(@Ctx() ctx: Context){
        await ctx.reply('👋 *Добро пожаловать в Телеграм бота ShizoShop!*\n\nИспользуйте меню ниже для навигации по разделам:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('👕 Товары', 'products')],
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
            await ctx.reply('✅ Аккаунт успешно привязан!\n\nТеперь вам доступны все функции магазина прямо здесь, в Telegram.\n\nИспользуйте меню ниже для навигации по разделам:',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('👕 Товары', 'products')],
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
            if(user === null){
                //await ctx.replyWithPhoto({source: 'C:\\Users\\sn1f1r\\Pictures\\Annotation 2026-03-02 200447.png'}, {caption: 'Registration on official site'})

                await ctx.reply('🛍 Для доступа ко всем функциям магазина привяжите Telegram к аккаунту на сайте.', Markup.inlineKeyboard([
                    [
                        Markup.button.url('🔗 Привязать', `${process.env.APP_URL}/telegram/connect`),
                        Markup.button.callback('🆘 Поддержка', 'support'),
                    ]
                ]))
            }else{
                await this.mainMenu(ctx)
            }
        }

    }
    @Action('products')
    async products(@Ctx() ctx: Context){
        const product = await this.productService.find()
        product.map(async (product) => {
            await ctx.replyWithPhoto({url: product.urlPicture}, {
                caption: `🏷 Название: ${product.title}\n 💸 Стоимость: ${product.price} ₽ \n 📝 Описание: ${product.description} \n 🧵 Материал: ${product.material} \n 📏 Размеры: ${product.dimensions} \n 📦 В наличии: ${product.inStock}`,
                parse_mode: "Markdown",
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('-', `qty:decrease:${product.id}`),
                        Markup.button.callback(`${1} шт`, 'current'),
                        Markup.button.callback('+', `qty:increase:${product.id}`),
                    ],
                    [Markup.button.url('⭐ Отзывы', 'https://t.me')],
                    [Markup.button.callback('🛒 Добавить в корзину', `addToCart:${product.id}:qty:${1}`)]
                ])
            })
        })
    }
    @Action(/^qty:increase:(.+)$/)
    async increase(@Ctx() ctx: Context){
        const qty = (ctx as any).session['qty'] = ((ctx as any).session['qty'] || 1) + 1
        const productId = (ctx as any).match[1]
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('−', `qty:decrease:${productId}`),
                    Markup.button.callback(`${qty} шт.`, 'qty:current'),
                    Markup.button.callback('+', `qty:increase:${productId}`),
                ],
                [Markup.button.url('⭐ Отзывы', 'https://t.me')],
                [Markup.button.callback('🛒 Добавить в корзину', `addToCart:${productId}:qty:${qty}`)],
            ]).reply_markup
        );
        await ctx.answerCbQuery();

    }
    @Action(/^qty:decrease:(.+)$/)
    async decrease(@Ctx() ctx: Context){
        const qty = (ctx as any).session['qty'] = ((ctx as any).session['qty'] || 1) - 1
        const productId = (ctx as any).match[1]
        if(qty <= 0){
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback('−', `qty:decrease:${productId}`),
                        Markup.button.callback(`${1} шт.`, 'qty:current'),
                        Markup.button.callback('+', `qty:increase:${productId}`),
                    ],
                    [Markup.button.url('⭐ Отзывы', 'https://t.me')],
                    [Markup.button.callback('🛒 Добавить в корзину', `addToCart:${productId}:qty:${qty}`)],
                ]).reply_markup
            );
            await ctx.answerCbQuery();
        }else {
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback('−', `qty:decrease:${productId}`),
                        Markup.button.callback(`${qty} шт.`, 'qty:current'),
                        Markup.button.callback('+', `qty:increase:${productId}`),
                    ],
                    [Markup.button.url('⭐ Отзывы', 'https://t.me')],
                    [Markup.button.callback('🛒 Добавить в корзину', `addToCart:${productId}:qty:${qty}`)],
                ]).reply_markup
            );
            await ctx.answerCbQuery();
        }

    }
    @Action(/^addToCart:(.+):qty:(.+)$/)
    async addToCart(@Ctx() ctx: Context){
        const productId = (ctx as any).match[1]
        let quantity = (ctx as any).match[2]
        const product = await this.productService.findOne({
            where:{
                id: productId
            }
        })
        const user = await this.userService.findOne({
            where:{
                telegramId: BigInt(ctx.from!.id)
            }
        })
        const cart = await this.cartService.findOne({
            where:{
                user: {id: user?.id}
            }, relations: ['items', 'items.product']
        })
        const item = cart!.items.find(item => item.productId === product?.id)
        if(item){
            console.log(typeof item.quantity,typeof quantity)
            item.quantity += Number(quantity)
            if(item.quantity > product!.inStock){
                await ctx.editMessageCaption(`🏷 Название: ${product!.title}\n 💸 Стоимость: ${product!.price} ₽ \n 📝 Описание: ${product!.description} \n 🧵 Материал: ${product!.material} \n 📏 Размеры: ${product!.dimensions} \n 📦 В наличии: ${0}`,
                    {
                        reply_markup:{
                            inline_keyboard:[
                                [
                                    Markup.button.callback('−', `qty:decrease:${productId}`),
                                    Markup.button.callback(`${quantity} шт.`, 'noop'),
                                    Markup.button.callback('+', `qty:increase:${productId}`),
                                ],
                                [Markup.button.url('⭐ Отзывы', 'https://t.me')],
                                [Markup.button.callback('🛒 Добавить в корзину', `addToCart:${productId}:qty:${++quantity-1}`)],
                            ]
                        }

                    }
                )
            }else{
                product!.inStock -= quantity
                console.log(item.quantity)
                if(product === null){
                    return 'asd'
                }
                await this.productService.save(product)
                await this.cartItem.save(item)
                await ctx.editMessageCaption(`🏷 Название: ${product!.title}\n 💸 Стоимость: ${product!.price} ₽ \n 📝 Описание: ${product!.description} \n 🧵 Материал: ${product!.material} \n 📏 Размеры: ${product!.dimensions} \n 📦 В наличии: ${product!.inStock}`,
                    {
                        reply_markup:{
                            inline_keyboard:[
                                [Markup.button.callback('⬅️ Назад', 'back_to_menu')]
                            ]
                        }

                    }
                )

                //await this.productService.save(product)
                //return await this.cartItem.save(item)
            }
        }
        // else{
        //     const newItem = await this.cartItem.save(this.cartItem.create({
        //         productId: product.id,
        //         quantity: dto.quantity,
        //         cartId: cart.id
        //     }))
        //     return newItem
        // }

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
        const totalPrice = cart?.items.reduce((sum, item) => {
            return sum + item.product.price * item.quantity;
        }, 0);
        const cartItem = cart?.items.map((item) => {
            return `🏷 *${item.product.title}* \n *Количество: * ${item.quantity} \n *Цена:* ${item.product.price} ₽ × ${item.quantity} = ${item.product.price * item.quantity} ₽ \n\n *💳 Итого:* ${totalPrice} ₽` ;
        }).join(`\n\n`)
        const message = `
        🛒 *Ваша корзина:*
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