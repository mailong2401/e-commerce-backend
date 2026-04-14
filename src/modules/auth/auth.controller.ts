import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from 'src/modules/user/dto/createUser';
import { LoginDto } from 'src/modules/user/dto/login';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  sendOtp(@Body('email') email: string, @Body('username') username: string) {
    return this.authService.sendOtpRegister(email, username);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Body('otp') otp: string) {
    return this.authService.register(registerDto, otp);
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

  @Patch('address')
  @UseGuards(AuthGuard('jwt')) // ← 'jwt' khớp với tên strategy
  updateAddress(@Req() request: any, @Body() body: { address: string }) {
    // User info đã được JwtStrategy gắn vào request.user
    return this.authService.updateAddress(request.user.userId, body.address);
  }
}
