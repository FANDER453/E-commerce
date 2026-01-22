import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registration')
  async registration(@Body() dto: AuthDto, @Res() res: express.Response) {
    const userEntity = await this.authService.registration(dto);
    const { user, token } = userEntity;
    const accessToken = token?.accessToken;
    const refreshToken = token?.refreshToken
    console.log(user);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
    });
    res.json({
      success: true,
      accessToken: accessToken,
      id: user.id,
      email: user.email,
    });
  }

  @Get('activation/:link')
  async activate(@Param() prams: any, @Res() res: express.Response){
    const link = this.authService.activate(prams.link);
    const redirectUrl:any = process.env.REDIRECT_URL;
    res.redirect(redirectUrl);
  }
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const UserEntity = await this.authService.login(dto);

    res.cookie('refreshToken', UserEntity.refreshToken, {
      httpOnly: true,
    });
    res.json({
      success: true,
      accessToken: UserEntity.accessToken,
      id: UserEntity.user.id,
      email: UserEntity.user.email,
    });
  }
  @Post('/refresh')
  async refresh(@Req() req: express.Request) {
    const refreshToken = req.cookies.refreshToken;
    const token = await this.authService.refresh(refreshToken);
    return {
      success: true,
      accessToken: token,
    };
  }
  @Post('/logout')
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    console.log(refreshToken);
    await this.authService.logout(refreshToken);
    res.clearCookie('refreshToken');
    return {
      success: true,
    };
  }
}
