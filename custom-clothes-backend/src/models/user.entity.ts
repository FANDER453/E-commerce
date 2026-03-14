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

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @OneToMany(() => CartEntity, (cart) => cart.userId)
  carts: CartEntity[];
}