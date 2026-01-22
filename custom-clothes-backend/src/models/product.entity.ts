import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('product')
export class ProductEntity {
  @PrimaryGeneratedColumn('increment')
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
}
