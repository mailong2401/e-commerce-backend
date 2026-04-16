import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entity/product.entity';
import { ProductVariant } from './entity/product-variant.entity';
import { VariantImage } from './entity/variant-image.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,

    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,

    @InjectRepository(VariantImage)
    private imageRepo: Repository<VariantImage>,
  ) {}

  async create(dto: CreateProductDto) {
    // dto đã có sẵn URL từ FE gửi lên

    // 1. Tạo product với thumbnailUrl từ FE
    const product = this.productRepo.create({
      name: dto.name,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl, // FE gửi URL thumbnail lên
    });

    await this.productRepo.save(product);

    // 2. Tạo variants (FE đã gửi kèm URL ảnh)
    for (const variantDto of dto.variants) {
      const variant = this.variantRepo.create({
        product,
        size: variantDto.size,
        color: variantDto.color,
        price: variantDto.price,
        stock: variantDto.stock,
        imageUrl: variantDto.imageUrl, // FE gửi URL ảnh chính của variant
      });

      await this.variantRepo.save(variant);

      // 3. Tạo ảnh phụ (FE đã gửi mảng URL)
      const subImages: VariantImage[] = [];

      for (const subImageUrl of variantDto.subImages || []) {
        const img = this.imageRepo.create({
          variant,
          imageUrl: subImageUrl,
        });
        subImages.push(img);
      }

      if (subImages.length > 0) {
        await this.imageRepo.save(subImages);
      }
    }

    return { status: 200, success: true, message: 'Tạo sản phẩm thành công' };
  }
}
