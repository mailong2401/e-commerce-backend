import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  lastName!: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  newPassword!: string;

  @IsOptional()
  @IsPhoneNumber('VN')
  @MinLength(6)
  phone!: string;
}
