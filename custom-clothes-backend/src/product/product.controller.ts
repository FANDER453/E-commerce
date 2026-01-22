import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly shoppingCartService: ProductService) {}

  @Post('/create')
  create(@Body() createShoppingCartDto: CreateProductDto) {
    return this.shoppingCartService.create(createShoppingCartDto);
  }

  @Get()
  findAll() {
    return this.shoppingCartService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shoppingCartService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShoppingCartDto: UpdateProductDto) {
    return this.shoppingCartService.update(+id, updateShoppingCartDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shoppingCartService.remove(+id);
  }
}
