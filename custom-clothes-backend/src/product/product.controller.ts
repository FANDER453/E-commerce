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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RolesGuard } from '../guards/role.guard';
import { Role } from '../enums/role.enum';
import { Roles } from '../decorator/role.decorator';
import { AuthGuard } from '../guards/auth.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly shoppingCartService: ProductService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Post('/create')
  @Roles(Role.ADMIN)
  create(
    @Body() createShoppingCartDto: CreateProductDto,
    @Headers('Authorization') unParsedApiKey: any,
  ) {
    const apiKey = unParsedApiKey.split(' ')[1];
    return this.shoppingCartService.create(createShoppingCartDto, apiKey);
  }

  @Post('update/:id')
  update(
    @Param() params: any,
    @Body() updateShoppingCartDto: UpdateProductDto,
  ) {
    return this.shoppingCartService.update(params.id, updateShoppingCartDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shoppingCartService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shoppingCartService.remove(+id);
  }
}
