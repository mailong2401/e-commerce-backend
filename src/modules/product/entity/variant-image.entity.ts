// variant-image.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ProductVariant } from './product-variant.entity';

@Entity('variant_images')
export class VariantImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ProductVariant, (variant) => variant.subImages, {
    onDelete: 'CASCADE',
  })
  variant!: ProductVariant;

  @Column()
  imageUrl!: string;
}
