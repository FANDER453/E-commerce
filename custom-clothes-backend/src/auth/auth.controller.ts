import {Body, Controller, Get, Post} from '@nestjs/common';
import { AuthService } from './auth.service';
import {AuthDto} from "./dto/auth.dto";
import {LoginDto} from "./dto/login.dto";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    @Post('registration')
    async registration(@Body() dto: AuthDto){
        await this.authService.registration(dto)
        return {
            success: true,
            message: "User create",
            statusCode: 201,
        }
  }@Post('login')
    async login(@Body() dto: LoginDto){
        const token = await this.authService.login(dto)
        return {
            success: true,
            message: "User login",
            statusCode: 201,
            token
        }
    }
}
