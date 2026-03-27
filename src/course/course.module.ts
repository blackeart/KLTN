import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { CourseEntity } from '../entities/course.entity';
import { CourseClassEntity } from '../entities/course-class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourseEntity, CourseClassEntity])],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService], // Export nếu AI Service cần dùng để tra cứu
})
export class CourseModule {}
