import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatEntity } from '../chat.entity'; // Đường dẫn tới file entity của bạn

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private configService: ConfigService,
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>, // Tiêm Repository vào đây
  ) {
    const apiKey = this.configService.get<string>('KEY_AI_GEMINI');
    console.log('API Key check:', apiKey);
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Model Pro thường có độ phủ rộng hơn và ít lỗi 404 hơn ở các vùng khác nhau
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
    });
  }

  async handleChat(userQuestion: string) {
    try {
      const prompt = `Bạn là tư vấn viên VTI Academy. Trả lời câu hỏi: ${userQuestion}`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      // Lưu DB
      const newChat = this.chatRepository.create({
        question: userQuestion,
        answer: aiResponse,
      });
      await this.chatRepository.save(newChat);

      return aiResponse;
    } catch (error) {
      console.error('Lỗi chi tiết từ Google AI:', error);
      return 'Xin lỗi, chatbot đang bảo trì. Bạn vui lòng liên hệ hotline 0866.805.563 nhé!';
    }
  }
}
