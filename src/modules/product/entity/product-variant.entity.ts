// product-variant.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';
import { VariantImage } from './variant-image.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  product!: Product;

  @Column()
  size!: string;

  @Column()
  color!: string;

  @Column('decimal')
  price!: number;

  @Column()
  stock!: number;

  @Column()
  imageUrl!: string; // ảnh chính của variant

  @OneToMany(() => VariantImage, (img) => img.variant)
  subImages!: VariantImage[]; // các ảnh phụ của variant
}
