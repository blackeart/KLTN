import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  // Hàm Đăng ký (Dùng để tạo tài khoản Admin đầu tiên)
  async register(username: string, pass: string) {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(pass, saltOrRounds);

    try {
      const user = this.userRepo.create({ username, password: hashedPassword });
      await this.userRepo.save(user);
      return { message: 'Đăng ký thành công!' };
    } catch (error) {
      throw new ConflictException('Tên đăng nhập đã tồn tại!');
    }
  }

  // Hàm Đăng nhập
  async login(username: string, pass: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại!');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu không chính xác!');
    }

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      expires_in: '24h',
    };
  }
}
