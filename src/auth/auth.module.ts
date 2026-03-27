import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserEntity } from '../entities/user.entity';

@Module({
  imports: [
    // 1. Đăng ký bảng User cho module này
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule,
    // 2. Cấu hình JWT tại đây
    JwtModule.register({
      secret: 'MY_SUPER_SECRET_KEY', // Nên lấy từ ConfigService
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService], // Xuất ra nếu các module khác cần dùng
})
export class AuthModule {}
