import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt, { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as any;
    const reqToken = request.headers['authorization'];
    if (!reqToken || !reqToken.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = reqToken.split(' ')[1]
    console.log(token)
    try {
      // @ts-ignore
      const payload = jwt.verify(token, process.env.ACCESS_KEY) as JwtPayload;
      request.user = payload
      return request.user

    } catch (e) {
      console.log(e);
    }
    return true
  }
}
