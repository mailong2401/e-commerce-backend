import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/user/User.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RedisService } from './redis.service';
import { OtpService } from '../otp/otp.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RedisService, OtpService],
  imports: [
    JwtModule.register({
      signOptions: {},
    }),
    TypeOrmModule.forFeature([User]),
  ],
})
export class AuthModule {}
