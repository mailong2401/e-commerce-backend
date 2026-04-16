// product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column()
  thumbnailUrl!: string; // ảnh hiển thị ngoài list

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants!: ProductVariant[];
}
