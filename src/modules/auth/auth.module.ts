import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/User';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret-key-e-commerce',
      signOptions: {
        expiresIn: '15m', // Access token hết hạn sau 15 phút
      },
    }),
    TypeOrmModule.forFeature([User]),
  ],
})
export class AuthModule {}
