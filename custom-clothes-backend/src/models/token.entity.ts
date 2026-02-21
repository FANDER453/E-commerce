import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity('token')
export class TokenEntity {
    @PrimaryGeneratedColumn('uuid')
    userid: number;

    @Column({unique: true, type: 'varchar', length: 500})
    refreshToken: string;
}