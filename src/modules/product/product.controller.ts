import { Body, Controller, Post } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Post()
  async create(@Body() dto: CreateProductDto) {
    // Không cần @UploadedFile() nữa, chỉ nhận JSON
    return this.productService.create(dto);
  }
}
