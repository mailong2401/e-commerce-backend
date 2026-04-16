// create-product.dto.ts
import {
  IsString,
  IsUrl,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class VariantImageDto {
  @IsUrl()
  imageUrl!: string;
}

class VariantDto {
  @IsString()
  size!: string;

  @IsString()
  color!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  stock!: number;

  @IsUrl()
  imageUrl!: string;

  @IsArray()
  @IsUrl({}, { each: true }) // ✅ Validate mỗi phần tử là URL
  @IsOptional()
  subImages?: string[]; // ✅ Mảng string
}

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsUrl()
  thumbnailUrl!: string;

  @IsArray()
  @ValidateNested({ each: true }) // áp dụng cho từng phần tử trong mảng
  //@Type() giúp chuyển đổi object thường(vì dữ liệu ở FE gửi lên luôn là object thường) thành instance của class cụ thể.
  //nghĩa là nói NestJS "hãy biến mỗi phần tử trong mảng thành VariantDto"
  @Type(() => VariantDto)
  variants!: VariantDto[];
}
