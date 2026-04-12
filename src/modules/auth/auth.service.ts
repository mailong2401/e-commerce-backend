import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/User';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/dto/createUser';
import { LoginDto } from 'src/dto/login';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;
    const existingUser = await this.userRepo.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('User đã tồn tại!');
    }
    const hashedPassword = await bcrypt.hash(password, 10); //Salt 10
    const user = await this.userRepo.create({
      name,
      email,
      password: hashedPassword,
    });
    this.userRepo.save(user);
    const { password: _, ...result } = user;
    return result;
  }
  async login(loginDto: LoginDto, response: Response) {
    const { name, password } = loginDto;

    // Tìm user
    const user = await this.userRepo.findOneBy({ name });
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
      name: user.name,
      role: user.role,
    };

    // Tạo access token (15 phút)
    const accessToken = this.jwtService.sign(payload);

    // Tạo refresh token (7 ngày)
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Set cookies
    this.setAuthCookies(response, accessToken, refreshToken);

    return {
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshToken(response: any, refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Tạo access token mới
      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
      const newAccessToken = this.jwtService.sign(newPayload);

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

  async logout(response: any) {
    // Xóa cookies
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return { message: 'Đăng xuất thành công' };
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
}
