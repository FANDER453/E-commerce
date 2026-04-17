import { Body, Controller, Post, UseGuards, Headers } from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { OrderItemDto } from './dto/order.dto';
import { OrderGuard } from 'src/guards/order.guard';
import jwt from 'jsonwebtoken'


@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AuthGuard)//, OrderGuard)
  @Post()
  async order(
    @Headers('Authorization') unParsedApiKey: any
  ){
    const decode = await jwt.verify(unParsedApiKey.split(' ')[1], process.env.ACCESS_KEY!)
    return this.orderService.order(decode)
  }

}
