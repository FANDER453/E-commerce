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