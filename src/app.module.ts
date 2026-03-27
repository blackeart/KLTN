import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatController } from './chat/chat.controller';
import { AiService } from './ai/ai.service';
import { AuthModule } from './auth/auth.module'; // Import cái này
import { ChatEntity } from './entities/chat.entity';
import { KnowledgeEntity } from './entities/knowledge.entity';
import { UserEntity } from './entities/user.entity';
import { CourseEntity } from './entities/course.entity';
import { CourseClassEntity } from './entities/course-class.entity';
import { CourseModule } from './course/course.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'user',
      password: 'password',
      database: 'nest_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      ChatEntity,
      KnowledgeEntity,
      UserEntity,
      CourseEntity,
      CourseClassEntity,
    ]),
    // 3. THÊM AUTH MODULE VÀO ĐÂY
    AuthModule,
    CourseModule,
  ],
  controllers: [AppController, ChatController],
  // 4. XÓA AuthController và AuthService khỏi đây vì nó đã nằm trong AuthModule rồi
  providers: [AppService, AiService],
})
export class AppModule {}
