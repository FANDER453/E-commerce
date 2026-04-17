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
        nullable: true,
        type: 'enum',
        enum: OrderStatus,
     })
    status: OrderStatus

    @Column()
    order_price: number

    @ManyToOne(() => UserEntity, (userid) => userid.orders)
    @JoinColumn({name: 'userId'})
    userId: UserEntity

    @OneToOne(() => CartEntity)
    @JoinColumn({name: 'cartId'})
    cartId: CartEntity
}