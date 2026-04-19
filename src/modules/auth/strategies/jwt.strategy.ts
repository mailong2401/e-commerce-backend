// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  //PassportStrategy mặc định tên là 'jwt'
  constructor() {
    super({
      // Lấy JWT từ cookie thay vì Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token;
        },
      ]),
      secretOrKey: process.env.ACCESS_TOKEN_SECRET || 'secret-key-e-commerce',
    });
  }

  async validate(payload: any) {
    // Payload chứa thông tin đã decode từ JWT
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
