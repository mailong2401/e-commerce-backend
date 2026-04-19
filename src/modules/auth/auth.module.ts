import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/modules/user/entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RedisService } from './redis/redis.service';
import { OtpService } from './otp/otp.service';
import { GoogleStrategy } from './google/google.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RedisService,
    OtpService,
    GoogleStrategy,
  ],
  imports: [
    JwtModule.register({
      signOptions: {},
    }),
    TypeOrmModule.forFeature([User]),
  ],
})
export class AuthModule { }
