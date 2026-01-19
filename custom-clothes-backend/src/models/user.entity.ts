import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";
import {UserRole} from "./user.role";

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('increment')
    id: string;

    @Column({unique: true})
    name: string;

    @Column()
    password: string;

    @Column({unique: true})
    email: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER
    })
    role: UserRole;

    @Column({default: false})
    isActivated: boolean;

    @Column({default: 'null'})
    linkActivated: string
}