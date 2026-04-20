import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Injectable()
export class CookieSevice {
  constructor(private configService: ConfigService) { }

  setAuthCookies(response: any, accessToken: string, refreshToken: string) {
    this.setAccessTokenCookie(response, accessToken);
    this.setRefreshTokenCookie(response, refreshToken);
  }

  setAccessTokenCookie(response: Response, accessToken: string) {
    response.cookie('access_token', accessToken, {
      httpOnly: true, // Không cho JS truy cập (chống XSS)
      secure: this.configService.get('NODE_ENV') === 'production', // Chỉ HTTPS trong production
      sameSite: 'strict', // Chống CSRF
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
  }

  setRefreshTokenCookie(response: Response, refreshToken: string) {
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 1000,
      path: '/',
    });
  }
  clearAuthCookies(response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
  }
}
