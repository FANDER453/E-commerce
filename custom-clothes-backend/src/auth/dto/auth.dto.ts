import {IsEmail, IsNotEmpty, MinLength} from "class-validator";

export class AuthDto{
    @IsNotEmpty()
    name: string;

    @MinLength(6)
    password: string;

    @IsNotEmpty()
    @IsEmail({
        require_tld: true
    })
    email: string;
}