import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @Post('registration')
  async registration(@Body() dto: AuthDto) {
    await this.authService.registration(dto);
    return {
      success: true,
      message: 'User create',
      statusCode: 201,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: express.Response){const token = await this.authService.login(dto)
        res.cookie('refreshToken', token.refreshToken, {
          httpOnly:true,
          secure: false,
          sameSite: 'lax',
          path: '/auth',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });
        return{
          success: true,
          message: "User success login",
          statusCode: 201,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken
        }
    }
    @Post('/refresh')
    async refresh(@Req() req: express.Request){
        const refreshToken = req.cookies.refreshToken
        const token = await this.authService.refresh(refreshToken)
        return{
          success: true,
          message: "AccessToken success update",
          statusCode: 201,
          token
        }
    }
    @Post('/logout')
    async logout(@Req() req: express.Request, @Res({ passthrough: true }) res: express.Response){
        const refreshToken = req.cookies.refreshToken
        await this.authService.logout(refreshToken)
        res.clearCookie(refreshToken, {
            httpOnly:true,
            secure: false,
            sameSite: 'lax',
            path: '/auth',
        })
        return{
            success: true,
            message: "User success logout",
            statusCode: 201,
        }
    }

}
