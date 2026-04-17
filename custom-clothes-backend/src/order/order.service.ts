import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartEntity } from 'src/models/cart.entity';
import { OrderEntity} from 'src/models/order.entity';
import { ProductEntity } from 'src/models/product.entity';
import { UserEntity } from 'src/models/user.entity';
import { EntityPropertyNotFoundError, Repository } from 'typeorm';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(OrderEntity)
        private orderService: Repository<OrderEntity>,
        @InjectRepository(UserEntity)
        private authService: Repository<UserEntity>,
        @InjectRepository(CartEntity)
        private cartService: Repository<CartEntity>,
        @InjectRepository(ProductEntity)
        private productService: Repository<ProductEntity>,
    ){}

    async order(decodeApiKey){
        console.log(decodeApiKey)
        const user = await this.authService.findOneBy({id: decodeApiKey.id})
        const cart = await this.cartService.findOne({
            where:{
                userId: {id: user?.id}
            },
            relations: ['userId', 'productId']
        })
        console.log(cart)
        
    }        
}
