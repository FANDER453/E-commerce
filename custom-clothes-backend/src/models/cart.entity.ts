import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { ProductEntity } from './product.entity';
import { OrderEntity } from './order.entity';

@Entity('cart')
export class CartEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  quantity: number

  @ManyToOne(() => UserEntity, (user) => user.carts)
  @JoinColumn({ name: 'userId' })
  userId: UserEntity

  @ManyToOne(() => ProductEntity, (product) => product.carts)
  @JoinColumn({ name: 'productId' })
  productId: object

  @OneToOne(() => OrderEntity, (order) => order.cartId)
  orderId: OrderEntity 

}