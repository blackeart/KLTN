import { Controller, Get, Render, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthViewGuard } from './auth/roles.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Get()
  // getHello(): string {
  //   return this.appService.getHello();
  // }

  @Get()
  @Render('index') // Tên file 'index.hbs' trong thư mục views
  root() {
    // Dữ liệu này sẽ được truyền vào dấu {{ message }} trong file hbs
    return { message: 'Hệ thống Tư vấn Tuyển Sinh AI' };
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
