import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity('token')
export class TokenEntity {
    @PrimaryGeneratedColumn('increment')
    userid: number;

    @Column({unique: true})
    refreshToken: string;
}