import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartEntity, CartItem } from 'src/models/cart.entity';
import { OrderEntity, OrderItem} from 'src/models/order.entity';
import { ProductEntity } from 'src/models/product.entity';
import { UserEntity } from 'src/models/user.entity';
import { EntityPropertyNotFoundError, Repository } from 'typeorm';

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
