import {
  Controller,
  Post,
  Body,
  Get,
  Render,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthDto } from './dto/auth.dto'; // Import DTO
import { AuthViewGuard } from './roles.guard';

@ApiTags('Auth - Xác thực') // Gom nhóm trên giao diện Swagger
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản Admin mới' })
  async register(@Body() authDto: AuthDto) {
    // Bây giờ bạn có thể dùng authDto.username thay vì body.username
    console.log('Đăng ký với username:', authDto.username);
    return this.authService.register(authDto.username, authDto.password);
  }

  @Post('login')
  async login(
    @Body() authDto: AuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = await this.authService.login(
      authDto.username,
      authDto.password,
    );
    console.log('Đăng nhập với username:', authDto.username);
    // Server tự set cookie tại đây
    response.cookie('access_token', data.access_token, {
      httpOnly: true, // Bảo mật, JS không đọc được để tránh XSS
      secure: false, // Để false nếu đang chạy localhost (http)
      maxAge: 24 * 60 * 60 * 1000, // 24 giờ
    });

    return { message: 'Đăng nhập thành công' };
  }

  @Get('login')
  @Render('login')
  getLogin() {
    return {}; // Trả về trang login.hbs
  }

  @UseGuards(AuthViewGuard) // CHẶN Ở ĐÂY
  @Get('admin')
  @Render('admin') // Trả về trang admin.hbs
  getAdmin() {
    return { user: 'Admin VTI' };
  }
}
