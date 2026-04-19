import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from 'src/modules/user/dto/register';
import { LoginDto } from 'src/modules/user/dto/login';
import { AuthGuard } from '@nestjs/passport';
import { UpdateDto } from '../user/dto/update';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  sendOtp(@Body('email') email: string, @Body('username') username: string) {
    return this.authService.sendOtpRegister(email, username);
  }

  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    return this.authService.checkEmailExists(email);
  }

  @Get('check-username')
  async checkUsername(@Query('username') username: string) {
    return this.authService.checkUsernameExists(username);
  }

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
  //Login với google
  // Bước 1: redirect sang Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {} //viết đại hàm gì cũng được vì có hàm thì Guards mới dùng được

  // Bước 2: callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.handleGoogleLogin(req.user, response);
  }
}
