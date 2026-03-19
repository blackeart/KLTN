import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger'; // Thêm các decorator này
import { AiService } from '../ai/ai.service';

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
}
