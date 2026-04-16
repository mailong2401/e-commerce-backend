import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/modules/user/dto/register';
import { LoginDto } from 'src/modules/user/dto/login';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp/otp.service';
import { ConfigService } from '@nestjs/config';
import { UpdateDto } from '../user/dto/update';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private jwtService: JwtService,
    readonly otpService: OtpService,
    private readonly configService: ConfigService,
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

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, username, email, password, phone, otp } =
      registerDto;
    await this.otpService.verifyOtp(email, otp);
    const existingEmail = await this.checkEmailExists(email);
    if (existingEmail.exists) {
      throw new ConflictException('Email đã tồn tại!');
    }
    const existingUsername = await this.checkUsernameExists(username);
    if (existingUsername) {
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

  private setAuthCookies(
    response: any,
    accessToken: string,
    refreshToken: string,
  ) {
    // Cookie cho access token
    response.cookie('access_token', accessToken, {
      httpOnly: true, // Không cho JS truy cập (chống XSS)
      secure: this.configService.get('NODE_ENV') === 'production', // Chỉ HTTPS trong production
      sameSite: 'strict', // Chống CSRF
      maxAge: 15 * 60 * 1000, // 15 phút
      path: '/',
    });

    // Cookie cho refresh token
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
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

      return { status: 200, success: true, message: 'Đã refresh token' };
    } catch (error) {
      throw new UnauthorizedException('Refresh token không hợp lệ!');
    }
  }

  logout(response: any) {
    // Xóa cookies
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return { status: 200, success: true, message: 'Đăng xuất thành công' };
  }

  async updateAddress(userId: string, address: string) {
    const existingUser = await this.userRepo.findOneBy({ id: Number(userId) });
    if (!existingUser) {
      throw new NotFoundException('User không tồn tại!');
    }
    await this.userRepo.update(userId, { address: address });
    return {
      status: 200,
      success: true,
      message: 'Cập nhật địa chỉ thành công!',
    };
  }

  async checkEmailExists(email: string) {
    if (!email) {
      throw new BadRequestException('Email này không được để trống');
    }
    const user = await this.userRepo.findOneBy({ email });
    return {
      exists: !!user,
    };
  }

  async checkUsernameExists(username: string) {
    if (!username) {
      throw new BadRequestException('Username không được để trống');
    }

    const user = await this.userRepo.findOneBy({ username });

    return {
      exists: !!user,
    };
  }

  async updateProfile(userId: number, updateData: Partial<UpdateDto>) {
    // Kiểm tra nếu không có dữ liệu cập nhật
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có dữ liệu cập nhật');
    }
    // Tìm user
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    if (updateData.firstName) {
      user.firstName = updateData.firstName;
    }
    if (updateData.lastName) {
      user.lastName = updateData.lastName;
    }

    if (updateData.newPassword) {
      if (!updateData.password) {
        throw new BadRequestException('Vui lòng nhập mật khẩu cũ');
      }

      const isPasswordValid = await bcrypt.compare(
        updateData.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new ConflictException('Mật khẩu cũ không đúng!');
      }

      user.password = await bcrypt.hash(updateData.newPassword, 10);
    }

    await this.userRepo.save(user);

    // Remove password trước khi trả về
    const { password, ...result } = user;
    return {
      status: 200,
      success: true,
      message: 'Cập nhật thành công',
      result: result,
    };
  }
}
