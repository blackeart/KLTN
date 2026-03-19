import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

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
}
