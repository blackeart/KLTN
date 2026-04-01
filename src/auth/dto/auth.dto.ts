import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator'; // Thêm các này

export class AuthDto {
  @ApiProperty({
    example: 'luan_admin',
    description: 'Tên đăng nhập của Admin',
  })
  @IsString({ message: 'Username phải là chuỗi ký tự' }) // Bắt buộc phải có
  @IsNotEmpty({ message: 'Username không được để trống' })
  username: string;

  @ApiProperty({
    example: '123456',
    description: 'Mật khẩu',
  })
  @IsString({ message: 'Password phải là chuỗi ký tự' }) // Bắt buộc phải có
  @IsNotEmpty({ message: 'Password không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}
