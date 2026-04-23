import {
  Controller,
  Post,
  Body,
  Get,
  Render,
  UseGuards,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger'; // Thêm các decorator này
import { AiService } from '../ai/ai.service';
import { AuthViewGuard } from 'src/auth/roles.guard';

@ApiTags('Chat') // Tên nhóm API trong Swagger
@Controller('chat')
export class ChatController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  @ApiOperation({ summary: 'Gửi câu hỏi cho AI tư vấn' }) // Mô tả ngắn gọn
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Khóa học Java bao nhiêu tiền?' },
      },
    },
  })
  async ask(@Body('message') message: string) {
    const reply = await this.aiService.handleChat(message);
    return {
      success: true,
      data: reply,
    };
  }

  @UseGuards(AuthViewGuard)
  @Get('admin')
  @Render('admin')
  getAdminPage() {
    return { title: 'Quản trị AI' };
  }

  @Post('knowledge')
  async addKnowledge(@Body() data: { title: string; content: string }) {
    // Thêm log để kiểm tra ở terminal
    console.log('Đang lưu kiến thức:', data);
    return await this.aiService.addKnowledge(data.title, data.content);
  }

  // SỬA Ở ĐÂY: Đổi 'add' thành 'all' để khớp với fetch bên ngoài
  @Get('knowledge/all')
  async getKnowledge() {
    const data = await this.aiService.getAllKnowledge();
    return data; // NestJS tự hiểu đây là JSON
  }

  @Put('knowledge/:id')
  async update(
    @Param('id') id: number,
    @Body() data: { title: string; content: string },
  ) {
    return this.aiService.updateKnowledge(id, data.title, data.content);
  }

  @Delete('knowledge/:id')
  async remove(@Param('id') id: number) {
    return this.aiService.deleteKnowledge(id);
  }

  @Get('test')
  async getKnowledge2() {
    return 'Kết nối OK!';
  }
}
