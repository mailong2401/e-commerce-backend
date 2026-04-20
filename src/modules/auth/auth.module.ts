import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/modules/user/entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RedisService } from './redis/redis.service';
import { OtpService } from './services/otp.service';
import { GoogleStrategy } from './google/google.strategy';
import { TokenService } from './services/token.service';
import { UserValidationService } from './services/user-validation.service';
import { CookieSevice } from './services/cookie.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RedisService,
    OtpService,
    GoogleStrategy,
    TokenService,
    UserValidationService,
    CookieSevice,
  ],
  imports: [
    JwtModule.register({
      signOptions: {},
    }),
    TypeOrmModule.forFeature([User]),
  ],
})
export class AuthModule { }
