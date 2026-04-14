import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/user/User.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/modules/user/dto/createUser';
import { LoginDto } from 'src/modules/user/dto/login';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './redis.service';
import { OtpService } from '../otp/otp.service';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private jwtService: JwtService,
    readonly otpService: OtpService,
    private readonly redisService: RedisService,
  ) {}

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

  async register(registerDto: RegisterDto, otp: string) {
    const { username, email, password, phone } = registerDto;
    // verify OTP (fail sẽ throw)
    await this.otpService.verifyOtp(email, otp);
    //check lại tránh race condition
    //dù đã unique ở database nhưng 2 request cùng verify OTP
    // → cả 2 đều pass OTP
    // → cùng insert DB
    // → 1 cái crash
    const existingUser = await this.userRepo.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('User đã tồn tại!');
    }
    const existingUsername = await this.userRepo.findOneBy({ username });
    if (existingUsername) {
      throw new ConflictException('Username đã tồn tại!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      username,
      email,
      password: hashedPassword,
      phone,
    });

    await this.userRepo.save(user);

    const { password: _, ...result } = user;
    return result;
  }

  private setAuthCookies(
    response: any,
    accessToken: string,
    refreshToken: string,
  ) {
    // Cookie cho access token
    response.cookie('access_token', accessToken, {
      httpOnly: true, // Không cho JS truy cập (chống XSS)
      secure: process.env.NODE_ENV === 'production', // Chỉ HTTPS trong production
      sameSite: 'strict', // Chống CSRF
      maxAge: 15 * 60 * 1000, // 15 phút
      path: '/',
    });

    // Cookie cho refresh token
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/',
    });
  }

  async login(loginDto: LoginDto, response: Response) {
    const { username, password } = loginDto;

    // Tìm user
    const user = await this.userRepo.findOneBy({ username });
    if (!user) {
      throw new NotFoundException('Sai tài khoản hoặc mật khẩu');
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    // Tạo payload cho JWT
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.username,
      role: user.role,
    };

    // Tạo access token (15 phút)
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '15m',
    });

    // Tạo refresh token (7 ngày)
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '7d',
    });

    // Set cookies
    this.setAuthCookies(response, accessToken, refreshToken);

    return {
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
        name: payload.name,
        role: payload.role,
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

      return { message: 'Đã refresh token' };
    } catch (error) {
      throw new UnauthorizedException('Refresh token không hợp lệ!');
    }
  }

  logout(response: any) {
    // Xóa cookies
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return { message: 'Đăng xuất thành công' };
  }

  async updateAddress(userId: string, address: string) {
    const existingUser = await this.userRepo.findOneBy({ id: Number(userId) });
    if (!existingUser) {
      throw new NotFoundException('User không tồn tại!');
    }
    await this.userRepo.update(userId, { address: address });
    return {
      message: 'Cập nhật địa chỉ thành công!',
    };
  }
}
