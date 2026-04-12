import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from 'src/dto/createUser';
import { LoginDto } from 'src/dto/login';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(loginDto, response);
  }

  @Post('refresh')
  async refresh(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token;
    return this.authService.refreshToken(response, refreshToken);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }

  // Protected route - yêu cầu phải có JWT valid
  @Get('profile')
  @UseGuards(AuthGuard('jwt')) // ← 'jwt' khớp với tên strategy
  getProfile(@Req() request: any) {
    // User info đã được JwtStrategy gắn vào request.user
    return request.user;
  }
}
