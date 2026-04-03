import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { CourseEntity } from '../entities/course.entity';
import { CourseClassEntity } from '../entities/course-class.entity';
import { AiService } from 'src/ai/ai.service';
import { ChatEntity } from 'src/entities/chat.entity';
import { KnowledgeEntity } from 'src/entities/knowledge.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseEntity,
      CourseClassEntity,
      ChatEntity,
      KnowledgeEntity,
    ]),
    ConfigModule,
  ],
  controllers: [CourseController],
  providers: [CourseService, AiService],
  exports: [CourseService], // Export nếu AI Service cần dùng để tra cứu
})
export class CourseModule {}
