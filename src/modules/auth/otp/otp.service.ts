// otp.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class OtpService {
  constructor(private readonly redisService: RedisService) { }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 số
  }

  async sendOtp(email: string) {
    const isCooldown = await this.redisService.get(`otp:cooldown:${email}`);

    if (isCooldown) {
      throw new BadRequestException('Vui lòng đợi 60s để gửi lại OTP');
    }

    const otp = this.generateOtp();

    // lưu Redis với TTL = 60s
    await this.redisService.set(`otp:register:${email}`, otp, 60);

    // set cooldown 60s
    await this.redisService.set(`otp:cooldown:${email}`, '1', 60);

    console.log(`OTP của ${email}: ${otp}`);

    return {
      status: 200,
      success: true,
      message: 'OTP đã được gửi',
    };
  }

  async verifyOtp(email: string, otpInput: string) {
    const savedOtp = await this.redisService.get(`otp:register:${email}`);

    if (!savedOtp) {
      throw new BadRequestException('OTP hết hạn hoặc không tồn tại!');
    }

    // 🔴 CHECK BLOCK TRƯỚC
    const failCount =
      Number(await this.redisService.get(`otp:fail:${email}`)) || 0;
    if (failCount >= 5) {
      throw new BadRequestException(
        'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 5 phút',
      );
    }

    if (savedOtp !== otpInput) {
      const newFailCount = await this.redisService.incr(`otp:fail:${email}`);

      if (newFailCount === 1) {
        await this.redisService.expire(`otp:fail:${email}`, 300); // 5 phút
      }

      throw new BadRequestException('OTP không đúng');
    }
    // Xóa đếm lần sai sau khi OTP đúng
    await this.redisService.del(`otp:fail:${email}`);
    // Xóa OTP sau khi dùng
    await this.redisService.del(`otp:register:${email}`);
  }
}
