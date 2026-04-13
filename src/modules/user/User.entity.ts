import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  username!: string;

  @Column()
  password!: string;

  @Column()
  email!: string;

  @Column()
  phone!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ default: 'user' })
  role!: string;
}
