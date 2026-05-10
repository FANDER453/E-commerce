import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from './user.role';
import { ProductEntity } from './product.entity';
import { CartEntity } from './cart.entity';
import { OrderEntity } from './order.entity';

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({default: null, type: "bigint"})
    telegramId: bigint

    @Column({default: null, nullable: true})
    telegramLinkToken: string

    @Column({default: null})
    telegramLinked: boolean

    @Column({ unique: true })
    name: string;

    @Column()
    password: string;

    @Column({ unique: true })
    email: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.ADMIN,
    })
    role: UserRole;

    @Column({ default: false })
    isActivated: boolean;

    @Column({ default: 'null' })
    linkActivated: string;

    @OneToMany(() => ProductEntity, (product) => product.userId)
    products: ProductEntity[];

    @OneToMany(() => CartEntity, (cart) => cart.user)
    carts: CartEntity[];

    @OneToMany(() => OrderEntity, (order) => order.user)
    orders: OrderEntity[]
}