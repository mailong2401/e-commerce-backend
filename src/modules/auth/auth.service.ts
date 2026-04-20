import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/modules/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from '@/modules/auth/services/otp.service';
import { UserValidationService } from './services/user-validation.service';
import { TokenService } from './services/token.service';
import { CookieSevice } from './services/cookie.service';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private jwtService: JwtService,
    private userValidationService: UserValidationService,
    private tokenService: TokenService,
    private cookieService: CookieSevice,
    readonly otpService: OtpService,
  ) { }

  async sendOtpRegister(email: string, username: string) {
    const existingEmail = await this.userRepo.findOneBy({ email });
    if (existingEmail) {
      throw new ConflictException('Email đã tồn tại!');
    }
    const existingUsername = await this.userRepo.findOneBy({ username });
    if (existingUsername) {
      throw new ConflictException('Username đã tồn tại!');
    }
    //Gửi OTP
    return await this.otpService.sendOtp(email);
  }

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, username, email, password, phone, otp } =
      registerDto;
    await this.otpService.verifyOtp(email, otp);
    const existingEmail =
      await this.userValidationService.checkEmailExists(email);
    if (existingEmail.exists) {
      throw new ConflictException('Email đã tồn tại!');
    }
    const existingUsername =
      await this.userValidationService.checkUsernameExists(username);
    if (existingUsername.exists) {
      throw new ConflictException('Username đã tồn tại!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      phone,
    });

    await this.userRepo.save(user);

    const { password: _, ...result } = user;
    return {
      status: 200,
      success: true,
      message: 'Đăng kí thành công!',
      result: result,
    };
  }

  async login(loginDto: LoginDto, response: Response) {
    const { username, password } = loginDto;

    const user = await this.userValidationService.validateCredentials(
      username,
      password,
    );
    if (!user) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    const payload = this.tokenService.createAuthPayload(user);
    const { accessToken, refreshToken } =
      this.tokenService.generateToken(payload);

    this.cookieService.setAuthCookies(response, accessToken, refreshToken);
    return {
      status: 200,
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  refreshToken(response: any, refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      // Tạo access token mới
      const newPayload = {
        sub: payload.sub,
        email: payload.email,
      };
      const newAccessToken = this.jwtService.sign(newPayload, {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: '15m',
      });

      // Set cookie mới
      response.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Chỉ gửi qua HTTPS trong production
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 phút
      });

      return { status: 200, success: true, message: 'Đã refresh token' };
    } catch (error) {
      throw new UnauthorizedException('Refresh token không hợp lệ!');
    }
  }

  logout(response: any) {
    this.cookieService.clearAuthCookies(response);
    // Xóa cookies
    return { status: 200, success: true, message: 'Đăng xuất thành công' };
  }

  async handleGoogleLogin(userData: any, response: Response) {
    let user = await this.userRepo.findOneBy({ email: userData.email });
    if (user) {
      if (user.googleId) {
        const payload = this.tokenService.createAuthPayload(user);
        this.tokenService.generateToken(payload);
        return {
          status: 200,
          success: true,
          message: 'Đăng nhập thành công',
          user: {
            id: user.id,
            name: user.username,
            email: user.email,
            role: user.role,
          },
        };
      } else {
        throw new ConflictException(
          'Đã có tài khoản không thể đăng kí với Google!',
        );
      }
    }
    //Đăng kí với google
    user = this.userRepo.create({
      googleId: userData.googleId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
    });
    const payload = this.tokenService.createAuthPayload(user);
    this.tokenService.generateToken(payload);
    return {
      status: 200,
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}
