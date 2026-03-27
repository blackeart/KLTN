import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({
    example: 'luan_admin',
    description: 'Tên đăng nhập của Admin',
  })
  username: string;

  @ApiProperty({
    example: '123456',
    description: 'Mật khẩu',
  })
  password: string;
}
