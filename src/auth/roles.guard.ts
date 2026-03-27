import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AuthViewGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Kiểm tra xem trong Cookie có access_token không
    const token = request.cookies?.access_token;

    if (!token) {
      const response = context.switchToHttp().getResponse();
      response.redirect('/login'); // Không có token thì đá về trang login
      return false;
    }
    return true;
  }
}
