import {IsNotEmpty, MinLength} from "class-validator";

export class LoginDto{
    @IsNotEmpty()
    name: string;

    @MinLength(6)
    password: string;
}