import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

// 1. DTO cho từng Day/Lesson
class CurriculumDayDto {
  @ApiProperty({ example: 'Day 1 - Lesson 1' })
  @IsString()
  dayTitle: string;

  @ApiProperty({
    example: [
      'Cài đặt môi trường',
      'Giới thiệu Web architecture',
      'Daily Assignment',
    ],
    type: [String],
  })
  @IsArray()
  lessons: string[];
}

// 2. DTO cho từng Học phần (Module)
class CurriculumModuleDto {
  @ApiProperty({ example: 'Học phần 1: DataBase MySQL' })
  @IsString()
  moduleName: string;

  @ApiProperty({ type: [CurriculumDayDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumDayDto)
  days: CurriculumDayDto[];
}

export class CreateCourseDto {
  @ApiProperty({ example: 'Khóa học Business Analyst' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Khóa đào tạo BA được VTI Academy chăm chút...' })
  @IsString()
  description: string;

  @ApiProperty({
    example: ['Sinh viên mới ra trường', 'Tester muốn chuyển sang BA'],
    type: [String],
  })
  @IsArray()
  targetAudience: string[];

  @ApiProperty({
    example: ['Công ty Outsourcing', 'Các ngân hàng', 'Freelance'],
    type: [String],
  })
  @IsArray()
  careerPath: string[]; // Tương ứng với jobOpportunities trong entity

  @ApiProperty({
    example: 'https://vtiacademy.edu.vn/upload/images/ba-banner.jpg',
    description: 'URL hình ảnh chính của khóa học',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl: string; // Đổi từ images[] sang imageUrl để khớp với logic hiển thị 1 ảnh đại diện

  @ApiProperty({
    example: [
      'Làm chủ quy trình thu thập yêu cầu',
      'Phân tích nghiệp vụ với BPMN',
    ],
    type: [String],
  })
  @IsArray()
  benefits: string[];

  // TRƯỜNG QUAN TRỌNG NHẤT: Cấu trúc lộ trình lồng nhau
  @ApiProperty({
    type: [CurriculumModuleDto],
    description: 'Khung chương trình học theo từng Module và Ngày',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumModuleDto)
  curriculum: CurriculumModuleDto[];
}
