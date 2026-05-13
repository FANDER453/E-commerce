import {Action, Ctx, Start, Update} from 'nestjs-telegraf';
import {Context, Markup} from "telegraf";
import {Repository} from "typeorm";
import {UserEntity} from "../models/user.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Injectable} from "@nestjs/common";
import jwt, {JwtPayload} from 'jsonwebtoken'
import uuid from 'uuid'
import {CartEntity, CartItem} from "../models/cart.entity";
import {ProductEntity} from "../models/product.entity";
import {OrderEntity, OrderItem} from "../models/order.entity";
import {OrderStatus} from "../enums/order.enum";

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
        private cartItem: Repository<CartItem>,
        @InjectRepository(OrderEntity)
        private orderService: Repository<OrderEntity>,
        @InjectRepository(OrderItem)
        private orderItem: Repository<OrderItem>

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
                        Markup.button.callback('📦 Заказы', 'orders'),
                        Markup.button.url('🆘 Поддержка', 'https://t.me/saber_966'),
                    ],
                    [
                        Markup.button.url('📺 Канал Shizo', 'https://t.me/customandshizo'),
                        Markup.button.callback('ℹ️ О нас', 'aboutUs')
                    ]
                ])
            }
        )
    }

    private async showProduct(@Ctx() ctx: Context, index: number){
        const product = await this.productService.find()
        if(index <= -1) {
            index = product.length - 1
        }
        else if(index >= product.length){
            index = 0
        }
        else if(product.length === 1){
            index = 0
        }
        const item = product[index]
        try{
            await ctx.editMessageMedia(
                {
                    type: 'photo',
                    media: item.urlPicture,
                    caption: `🏷 Название: ${item.title}\n 💸 Стоимость: ${item.price} ₽ \n 📝 Описание: ${item.description} \n 🧵 Материал: ${item.material} \n 📏 Размеры: ${item.dimensions} \n 📦 В наличии: ${item.inStock}`
                },
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                Markup.button.callback('⬅️', `product_prev:${index}`),
                                Markup.button.callback(`${index + 1}/${product.length}`, 'noop'),
                                Markup.button.callback('➡️', `product_next:${index}`)
                            ],
                            [
                                Markup.button.callback('-', `qty:decrease:${item.id}:${index}`),
                                Markup.button.callback(`${1} шт`, 'current'),
                                Markup.button.callback('+', `qty:increase:${item.id}:${index}`),
                            ],
                            [Markup.button.url('⭐ Отзывы', 'https://t.me')],
                            [Markup.button.callback('🛒 Добавить в корзину', `addToCart:${item.id}:qty:${1}:index:${index}`)],
                            [Markup.button.callback('⬅️ Назад', 'back_to_menu')],
                        ]
                    }

                })
        }catch (e){

        }

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
                            Markup.button.callback('📦 Заказы', 'orders'),
                            Markup.button.url('🆘 Поддержка', 'https://t.me/saber_966')
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
                await ctx.reply('🛍 Для доступа ко всем функциям магазина привяжите Telegram к аккаунту на сайте.', Markup.inlineKeyboard([
                    [
                        Markup.button.url('🔗 Привязать', `${process.env.APP_URL}/telegram/connect`),
                        Markup.button.url('🆘 Поддержка', 'https://t.me/saber_966'),
                    ]
                ]))
            }else{
                await this.mainMenu(ctx)
            }
        }

    }
    @Action('products')
    async products(@Ctx() ctx: Context){
        await this.showProduct(ctx, 0)
    }

    @Action(/^product_prev:(.+)$/)
    async productPrev(@Ctx() ctx: Context){
        const currentIndex = (ctx as any).match[1] - 1
        await this.showProduct(ctx, currentIndex)
    }
    @Action(/^product_next:(.+)$/)
    async productNext(@Ctx() ctx: Context){
        const currentIndex = Number((ctx as any).match[1]) + 1
        await this.showProduct(ctx, currentIndex)
    }

    @Action(/^qty:increase:(.+):(.+)$/)
    async increase(@Ctx() ctx: Context){
        const qty = (ctx as any).session['qty'] = ((ctx as any).session['qty'] || 1) + 1
        const productId = (ctx as any).match[1]
        const product = await this.productService.find()
        const index = Number((ctx as any).match[2])
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('⬅️', `product_prev:${index}`),
                    Markup.button.callback(`${index + 1}/${product.length}`, 'noop'),
                    Markup.button.callback('➡️', `product_next:${index}`)
                ],
                [
                    Markup.button.callback('−', `qty:decrease:${productId}:${index}`),
                    Markup.button.callback(`${qty} шт.`, 'qty:current'),
                    Markup.button.callback('+', `qty:increase:${productId}:${index}`),
                ],
                [Markup.button.url('⭐ Отзывы', 'https://t.me')],
                [Markup.button.callback('🛒 Добавить в корзину', `addToCart:${productId}:qty:${qty}`)],
                [Markup.button.callback('⬅️ Назад', 'back_to_menu')],
            ]).reply_markup
        );
        await ctx.answerCbQuery();

    }
    @Action(/^qty:decrease:(.+):(.+)$/)
    async decrease(@Ctx() ctx: Context){
        const qty = (ctx as any).session['qty'] = ((ctx as any).session['qty'] || 1) - 1
        const productId = (ctx as any).match[1]
        const product = await this.productService.find()
        const index = Number((ctx as any).match[2])
        if(qty <= 0){
            await ctx.answerCbQuery('Минимум 1 шт.')
        }else {
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback('⬅️', `product_prev:${index}`),
                        Markup.button.callback(`${index + 1}/${product.length}`, 'noop'),
                        Markup.button.callback('➡️', `product_next:${index}`)
                    ],
                    [
                        Markup.button.callback('−', `qty:decrease:${productId}:${index}`),
                        Markup.button.callback(`${qty} шт.`, 'qty:current'),
                        Markup.button.callback('+', `qty:increase:${productId}:${index}`),
                    ],
                    [Markup.button.url('⭐ Отзывы', 'https://t.me')],
                    [Markup.button.callback('🛒 Добавить в корзину', `addToCart:${productId}:qty:${qty}`)],
                    [Markup.button.callback('⬅️ Назад', 'back_to_menu')],
                ]).reply_markup
            );
        }

    }
    @Action(/^addToCart:(.+):qty:(.+):index:(.+)$/)
    async addToCart(@Ctx() ctx: Context){
        const productId = (ctx as any).match[1]
        let quantity = (ctx as any).match[2]
        const index = (ctx as any).match[3]
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
            item.quantity += Number(quantity)
            console.log(item.quantity)
            console.log(product!.inStock)
            if(product!.inStock <= 0){
                await ctx.editMessageCaption(`🏷 Название: ${product!.title}\n 💸 Стоимость: ${product!.price} ₽ \n 📝 Описание: ${product!.description} \n 🧵 Материал: ${product!.material} \n 📏 Размеры: ${product!.dimensions} \n 📦 В наличии: ${0}`,
                    {
                        reply_markup:{
                            inline_keyboard:[
                                [Markup.button.callback('⬅️ Назад', 'back_to_menu')],
                            ]
                        }

                    }
                )
            }else{
                product!.inStock -= quantity
                if(product === null){
                    return 'asd'
                }
                await this.productService.save(product)
                await this.cartItem.save(item)
                await this.showProduct(ctx, Number(index))
            }
        }
        else{
            const newItem = await this.cartItem.save(this.cartItem.create({
                productId: product!.id,
                quantity: quantity,
                cartId: cart!.id
            }))

            product!.inStock -= Number(quantity)

            await this.productService.save(product!)
            await this.cartItem.save(newItem)

            await this.showProduct(ctx, index)
        }

    }
    @Action('profile')
    async profile(@Ctx() ctx: Context){
        const user = await this.userService.findOne({
            where:{
                telegramId: BigInt(ctx.from!.id)
            }, relations: ['carts', 'orders']
        })
        const cart = await this.cartService.findOne({
            where:{
                userId: user?.id
            }, relations: ['items', 'items.product']
        })
        const message = `
        👤 *Ваш профиль*
        
🆔 **ID:** \`${user!.id}\`
🏷 **Имя:** ${user!.name || 'Не указано'}
📧 **Email:** ${user!.email || 'Не привязан'}
🛒 **Товаров в корзине:** ${cart?.items.length || 0}
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
            return `🏷 *${item.product.title}* \n *Количество: * ${item.quantity} \n *Цена:* ${item.product.price} ₽ × ${item.quantity} = ${item.product.price * item.quantity} ₽ \n ` ;
        }).join(``)
        console.log(totalPrice)
        const message = `
        🛒 *Ваша корзина:*
        \n${cartItem}
        \n*💳 Итого:* ${totalPrice} ₽
        `
        if(totalPrice == 0){
            await ctx.answerCbQuery('Корщина пуста')
        }else {
            await ctx.editMessageText(message, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🚚 Заказать', 'order')],
                    [Markup.button.callback('⬅️ Назад', 'back_to_menu')]
                ])
            })
        }

    }
    @Action('order')
    async order(@Ctx() ctx: Context){
        const user = await this.userService.findOne({
            where:{
                telegramId: BigInt(ctx.from!.id)
            }
        })
        const cart = await this.cartService.findOne({
            where: {
                userId: user?.id
            }, relations: ['items', 'items.product']
        })
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
            const orderItem = this.orderItem.create({
                title: item.product.title,
                quantity: item.quantity,
                price: item.product.price,
                product: item.product,
                order: order,
            });
            await this.orderItem.save(orderItem);
        });
        const message = `
        ✅ Ваш заказ по номером: ${order.id}\n 💸 Сумма заказа: ${totalPrice} ₽\n ⏳ Статус: ${order.status}
        `
        await this.cartItem.delete({cart: {id: cart?.id}})
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Главное меню', 'back_to_menu')]
            ])
        })
    }
    @Action('orders')
    async orders(@Ctx() ctx: Context){
        const user = await this.userService.findOne({
            where:{
                telegramId: BigInt(ctx.from!.id)
            }
        })
        const orders = await this.orderService.find({
            where:{
                userId: user?.id
            }, relations: ['items', 'items.product']
        })
        if(orders === null || orders === undefined){
            await ctx.answerCbQuery('У вас нет заказов')
        }
        const text = orders.map((order) => {
            const totalPrice = order!.items.reduce((sum, item) => {
                return sum + item.product.price * item.quantity;
            }, 0);
            return `📦 Заказ: ${order.id} - ${order.status} - ${totalPrice} ₽`
        }).join('\n\n')
        await ctx.editMessageText(text, {
            parse_mode:'Markdown',
            reply_markup: {
                inline_keyboard: [
                    ...orders.map((order) => ([
                        {
                            text: `📦 Заказ #${order.id}`,
                            callback_data: `order:${order.id}`,
                        },
                    ])),
                    [{ text: '🏠  Главное меню', callback_data: 'back_to_menu' }],
                ]
            }
        })
    }
    @Action(/^order:(.+)$/)
    async fullOrder(@Ctx() ctx: Context){
        const orderId= (ctx as any).match[1]
        const order = await this.orderService.findOne({
            where:{
                id: orderId
            }, relations: ['items', 'items.product']
        })
        const totalPrice = order!.items.reduce((sum, item) => {
            return sum + item.product.price * item.quantity;
        }, 0);
        order?.items.map((item) => {
            ctx.editMessageText(`📦 Заказ: ${order.id} \n\n🛒 Товары: \n• ${item.product.title} x ${item.quantity} = ${item.product.price * item.quantity} ₽ \n\n💸 Итого: ${totalPrice}`, {
                parse_mode:'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('⬅️ К заказам', 'orders')],
                    [Markup.button.callback('🏠 Главное меню', 'back_to_menu')],
                ])
            })
        })
    }
    @Action('back_to_menu')
    async backToMenu(@Ctx() ctx: Context){
        await ctx.deleteMessage()
        await this.mainMenu(ctx)
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