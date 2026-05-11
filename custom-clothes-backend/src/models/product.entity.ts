import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { CartEntity, CartItem } from './cart.entity';
import {OrderItem} from "./order.entity";

@Entity('product')
export class ProductEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    urlPicture: string;

    @Column({ nullable: false })
    title: string;

    @Column({ nullable: true })
    review: number;

    @Column({ nullable: true })
    grade: number;

    @Column({ nullable: false })
    price: number;

    @Column({nullable: false})
    description: string //описание

    @Column({nullable: false})
    material: string

    @Column({nullable: false})
    dimensions: string //размер

    @Column({nullable: false})
    inStock: number

    @Column({ name: 'user_id_creator', type: 'uuid', nullable: true })
    userIdCreator: string;

    @ManyToOne(() => UserEntity, (user) => user.products, { nullable: true })
    @JoinColumn({ name: 'user_id_creator' })
    userId: UserEntity;

    @OneToMany(() => CartItem, (item) => item.product)
    cart: CartEntity[];

  @OneToMany(() => OrderItem, (item) => item.product)
  order: OrderItem[];
}
