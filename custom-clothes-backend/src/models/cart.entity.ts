import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { ProductEntity } from './product.entity';

@Entity('cart')
export class CartEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.carts)
  @JoinColumn({ name: 'userId' })
  userId: UserEntity;

  @ManyToOne(() => ProductEntity, (product) => product.carts)
  @JoinColumn({ name: 'productId' })
  productId: ProductEntity;

  @Column()
  quantity: number;
}