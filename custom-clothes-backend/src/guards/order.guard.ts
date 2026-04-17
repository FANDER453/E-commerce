import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { UserEntity } from "src/models/user.entity";
import { Repository } from "typeorm";
@Injectable()
export class OrderGuard implements CanActivate {

    constructor(@InjectRepository(UserEntity) private userEntity: Repository<UserEntity>){}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest() as any;
        const reqToken = request.headers['authorization'];
        if (!reqToken || !reqToken.startsWith('Bearer ')) {
            throw new UnauthorizedException();
        }
        try{
            const token = reqToken.split(' ')[1];
            const decode = jwt.verify(token, process.env.ACCESS_KEY!) as JwtPayload
            const user = await this.userEntity.findOne({
                where:{
                    id: decode.id
                }
            })
            if(user?.carts === undefined){
                throw new HttpException({ message: 'Cart not found', success: false }, HttpStatus.BAD_REQUEST)
            }else{
                request.user = user;
                return request.user;
            }
        }
        
        catch (e) {
             if (e instanceof TokenExpiredError || e instanceof HttpException || e instanceof UnauthorizedException) {
                throw e;
            }
            console.log(e)
            return false
        }
    }
}