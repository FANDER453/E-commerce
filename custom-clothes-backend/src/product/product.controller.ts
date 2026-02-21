import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { RolesGuard } from '../guards/role.guard';
import { Role } from '../enums/role.enum';
import { Roles } from '../decorator/role.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { AddToCartProductDto } from './dto/addToCart.product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly shoppingCartService: ProductService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Post('/create')
  @Roles(Role.ADMIN)
  async create(
    @Body() createShoppingCartDto: CreateProductDto,
    @Headers('Authorization') unParsedApiKey: any,
  ) {
    const apiKey = unParsedApiKey.split(' ')[1];
    return await this.shoppingCartService.create(createShoppingCartDto, apiKey);
  }

  @UseGuards(AuthGuard)
  @Post('add-to-cart')
  async addToCart(
    @Body() addToCartDto: AddToCartProductDto,
    @Headers('Authorization' ) unParsedApiKey: any
  ){
    const apiKey = unParsedApiKey.split(' ')[1];
    return await this.shoppingCartService.addToCart(addToCartDto, apiKey);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('update/:id')
  async update(
    @Param() params: any,
    @Body() updateShoppingCartDto: UpdateProductDto,
  ) {
    return await this.shoppingCartService.update(params.id, updateShoppingCartDto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.shoppingCartService.get(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.shoppingCartService.remove(+id);
  }
}
