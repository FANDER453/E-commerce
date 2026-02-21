import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { UserEntity } from '../models/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private userEntity: Repository<UserEntity>
  ) {
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as any;
    const reqToken = request.headers['authorization'];
    if (!reqToken || !reqToken.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = reqToken.split(' ')[1];
    try {
      const payload = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload;
      const user = await this.userEntity.findOneBy({id: payload.id}) as UserEntity
      if(!user){
        throw new UnauthorizedException()
      }
      request.user = payload;
      return request.user;
    } catch (e) {
      if (e instanceof TokenExpiredError){
        throw new UnauthorizedException();
      }else if(e instanceof UnauthorizedException){
        throw new UnauthorizedException()
      }
      console.log(e)
      return false
    }

  }
}
