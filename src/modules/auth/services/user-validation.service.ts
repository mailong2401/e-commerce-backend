import { User } from '@/modules/user/entity/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';

@Injectable()
export class UserValidationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }
  async checkEmailExists(email: string) {
    if (!email) {
      throw new BadRequestException('Email này không được để trống');
    }
    const user = await this.userRepo.findOneBy({ email });
    return {
      exists: !!user,
    };
  }

  async checkUsernameExists(username: string) {
    if (!username) {
      throw new BadRequestException('Username không được để trống');
    }

    const user = await this.userRepo.findOneBy({ username });

    return {
      exists: !!user,
    };
  }

  async validateCredentials(username: string, password: string) {
    const user = await this.userRepo.findOneBy({ username });
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
