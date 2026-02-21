import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { CartEntity } from './cart.entity';

@Entity('product')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ nullable: true })
  urlPicture: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  review: number;

  @Column({ nullable: true })
  grade: number;

  @Column({ nullable: true })
  price: number;

  @Column({ name: 'user_id_creator', type: 'uuid', nullable: true })
  userIdCreator: string;

  @ManyToOne(() => UserEntity, (user) => user.products, {nullable: true})
  @JoinColumn({ name: 'user_id_creator' })
  userId: UserEntity;

  @OneToMany(() => CartEntity, (cart) => cart.productId)
  carts: CartEntity[];
}
