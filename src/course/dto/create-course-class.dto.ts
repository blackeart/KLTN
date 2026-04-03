import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseClassDto {
  @ApiProperty({ example: 'JAVA-2401' })
  @IsString()
  className: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 10000000 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  courseId: number;
}
