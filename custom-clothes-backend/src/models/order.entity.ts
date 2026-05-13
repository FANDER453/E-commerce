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