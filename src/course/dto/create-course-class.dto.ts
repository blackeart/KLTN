import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseClassDto {
  @ApiProperty({ example: 1, description: 'ID của Course tổng quan' })
  courseId: number;

  @ApiProperty({ example: 'ReactJS-01' })
  className: string;

  @ApiProperty({ example: '2026-02-02' })
  startDate: string;

  @ApiProperty({ example: '2026-06-03' })
  endDate: string;

  @ApiProperty({ example: 5000000 })
  basePrice: number;

  @ApiProperty({ example: 20 })
  discountPercentage: number;
}
