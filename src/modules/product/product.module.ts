import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entity/product.entity';
import { VariantImage } from './entity/variant-image.entity';
import { ProductVariant } from './entity/product-variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, VariantImage, ProductVariant])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
