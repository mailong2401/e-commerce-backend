import { User } from '@/modules/user/entity/user.entity';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthPayloadDto } from '../dto/auth-payload.dto';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }
  generateToken(payload: any) {
    // Tạo access token (15 phút)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: '15m',
    });

    // Tạo refresh token (7 ngày)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
  createAuthPayload(user: User): AuthPayloadDto {
    return {
      sub: user.id,
      email: user.email,
      name: user.username,
      role: user.role,
    };
  }
}
