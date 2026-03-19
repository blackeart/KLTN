import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // Quan trọng
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Thêm kiểu <NestExpressApplication> vào đây
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Khai báo thư mục chứa file .hbs (thường là folder 'views' ở gốc dự án)
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  // Khai báo engine sử dụng là hbs
  app.setViewEngine('hbs');

  // Serve static files (public/css, public/js, etc.)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  await app.listen(3001);
}
bootstrap();
