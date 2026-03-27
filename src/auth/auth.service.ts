import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity'; // Đảm bảo đúng đường dẫn tới folder entities mới của bạn
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  // --- PHƯƠNG THỨC ĐĂNG KÝ (Dùng để tạo tài khoản Admin) ---
  async register(username: string, pass: string) {
    try {
      // 1. Kiểm tra xem username đã tồn tại chưa
      const existingUser = await this.userRepo.findOne({ where: { username } });
      if (existingUser) {
        throw new ConflictException('Tên đăng nhập đã tồn tại!');
      }

      // 2. Mã hóa mật khẩu (Salt rounds = 10 là chuẩn bảo mật)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(pass, salt);

      // 3. Lưu vào database
      const newUser = this.userRepo.create({
        username,
        password: hashedPassword,
      });

      await this.userRepo.save(newUser);

      return {
        message: 'Đăng ký tài khoản Admin thành công!',
        username: newUser.username,
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new Error('Lỗi hệ thống khi đăng ký: ' + error.message);
    }
  }

  // --- PHƯƠNG THỨC ĐĂNG NHẬP ---
  async login(username: string, pass: string) {
    // 1. Tìm user
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng!');
    }

    // 2. So sánh mật khẩu đã nhập với mật khẩu đã mã hóa trong DB
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng!');
    }

    // 3. Tạo JWT Payload
    const payload = {
      username: user.username,
      sub: user.id,
      role: 'admin', // Bạn có thể thêm role để phân quyền sau này
    };

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: '24h', // Hiển thị thông tin thời hạn cho FE dễ xử lý
    };
  }
}
