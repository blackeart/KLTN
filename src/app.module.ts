import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatEntity } from './chat.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433, // Cổng bạn đã map ở docker-compose
      username: 'user', // Khớp với POSTGRES_USER trong docker-compose
      password: 'password', // Khớp với POSTGRES_PASSWORD
      database: 'nest_db', // Khớp với POSTGRES_DB
      autoLoadEntities: true, // Tự động nhận diện các Entity (Table) bạn tạo sau này
      synchronize: true, // Tự động tạo table từ code (Rất hữu ích khi làm khóa luận)
    }),
    TypeOrmModule.forFeature([ChatEntity]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
