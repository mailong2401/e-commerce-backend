import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateDto } from './dto/update';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Patch('address')
  @UseGuards(AuthGuard('jwt')) // ← 'jwt' khớp với tên strategy
  updateAddress(@Req() request: any, @Body() body: { address: string }) {
    // User info đã được JwtStrategy gắn vào request.user
    return this.userService.updateAddress(request.user.userId, body.address);
  }

  @Patch('update-profile')
  @UseGuards(AuthGuard('jwt'))
  updateProfile(@Req() request: any, @Body() body: Partial<UpdateDto>) {
    return this.userService.updateProfile(request.user.userId, body);
  }
}
