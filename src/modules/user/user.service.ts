import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { UpdateDto } from './dto/update';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async updateAddress(userId: string, address: string) {
    const existingUser = await this.userRepo.findOneBy({ id: Number(userId) });
    if (!existingUser) {
      throw new NotFoundException('User không tồn tại!');
    }
    await this.userRepo.update(userId, { address: address });
    return {
      status: 200,
      success: true,
      message: 'Cập nhật địa chỉ thành công!',
    };
  }

  async updateProfile(userId: number, updateData: Partial<UpdateDto>) {
    // Kiểm tra nếu không có dữ liệu cập nhật
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có dữ liệu cập nhật');
    }
    // Tìm user
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    if (updateData.firstName) {
      user.firstName = updateData.firstName;
    }
    if (updateData.lastName) {
      user.lastName = updateData.lastName;
    }

    if (updateData.newPassword) {
      if (!updateData.password) {
        throw new BadRequestException('Vui lòng nhập mật khẩu cũ');
      }

      const isPasswordValid = await bcrypt.compare(
        updateData.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new ConflictException('Mật khẩu cũ không đúng!');
      }

      user.password = await bcrypt.hash(updateData.newPassword, 10);
    }

    await this.userRepo.save(user);

    // Remove password trước khi trả về
    const { password, ...result } = user;
    return {
      status: 200,
      success: true,
      message: 'Cập nhật thành công',
      result: result,
    };
  }
}
