import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'Khóa học ReactJS' })
  name: string;

  @ApiProperty({ example: 'Học lập trình Web Front-end hiện đại với React' })
  description: string;

  @ApiProperty({
    example: ['Developer muốn học FE', 'Sinh viên CNTT'],
    type: [String],
  })
  targetAudience: string[];

  @ApiProperty({
    example: ['Công ty Outsourcing', 'Product Lab'],
    type: [String],
  })
  careerPath: string[];

  @ApiProperty({
    example: ['https://link-anh-1.jpg', 'https://link-anh-2.png'],
    description: 'Danh sách URL hình ảnh của khóa học',
    required: false,
  })
  images: string[];

  @ApiProperty({
    example: ['Làm chủ React Hook', 'Xây dựng dự án thực tế'],
    type: [String],
  })
  benefits: string[];

  @ApiProperty({
    example: ['Buổi 1: Hello World', 'Buổi 2: Component'],
    type: [String],
  })
  curriculum: string[];
}
