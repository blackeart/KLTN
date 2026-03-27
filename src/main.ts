import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Import các thư viện này
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- Cấu hình Swagger ---
  const config = new DocumentBuilder()
    .setTitle('VTI Academy AI Chatbot API')
    .setDescription('Tài liệu API cho hệ thống tư vấn tuyển sinh AI')
    .setVersion('1.0')
    .addTag('Chat') // Gắn tag để phân loại API
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Đường dẫn truy cập Swagger
  // -----------------------

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.use(require('cookie-parser')());

  await app.listen(3000);
}
bootstrap();
