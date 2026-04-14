import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { RedisService } from '../auth/redis.service';

@Module({
  controllers: [OtpController],
  providers: [OtpService, RedisService],
})
export class OtpModule {}
