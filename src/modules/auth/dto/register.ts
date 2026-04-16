import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  @MinLength(6)
  @IsPhoneNumber('VN')
  phone!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;
}
