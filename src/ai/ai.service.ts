import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatEntity } from '../chat.entity'; // Đảm bảo đúng đường dẫn
import { KnowledgeEntity } from '../knowledge.entity'; // Đảm bảo đúng đường dẫn

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private configService: ConfigService,
    @InjectRepository(ChatEntity)
    private chatRepo: Repository<ChatEntity>,
    @InjectRepository(KnowledgeEntity)
    private knowledgeRepo: Repository<KnowledgeEntity>,
  ) {
    const apiKey = this.configService.get<string>('KEY_AI_GEMINI');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
    });
  }

  // --- Chức năng cho Admin ---

  async addKnowledge(title: string, content: string) {
    const newK = this.knowledgeRepo.create({ title, content });
    return await this.knowledgeRepo.save(newK);
  }

  async getAllKnowledge() {
    return await this.knowledgeRepo.find({
      order: { id: 'DESC' }, // Hiện cái mới nhất lên đầu
    });
  }

  // --- Chức năng Chat có bộ nhớ và kiến thức ---

  async handleChat(userQuestion: string, sessionId: string = 'guest-session') {
    // 1. Lấy kiến thức thực tế từ DB
    const knowledgeBase = await this.knowledgeRepo.find();
    const context = knowledgeBase
      .map((k) => `- ${k.title}: ${k.content}`)
      .join('\n');

    // 2. Lấy lịch sử 5 câu gần nhất để AI "nhớ" ngữ cảnh
    const history = await this.chatRepo.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Đảo ngược lại để đúng thứ tự thời gian
    const historyText = history
      .reverse()
      .map((h) => `Người dùng: ${h.question}\nAI: ${h.answer}`)
      .join('\n');

    // 3. Xây dựng Prompt nâng cao (RAG + Memory)
    const systemPrompt = `
      Bạn là tư vấn viên tuyển sinh chuyên nghiệp của VTI Academy.
      Sử dụng KIẾN THỨC NỘI BỘ dưới đây để trả lời câu hỏi. 
      Nếu câu hỏi liên quan đến nội dung trong LỊCH SỬ CHAT, hãy trả lời tiếp nối ngữ cảnh đó.

      KIẾN THỨC NỘI BỘ:
      ${context}

      LỊCH SỬ CHAT GẦN ĐÂY:
      ${historyText}

      CÂU HỎI HIỆN TẠI: ${userQuestion}
      
      TRẢ LỜI: (Hãy trả lời thân thiện, ngắn gọn và chính xác)
    `;

    try {
      const result = await this.model.generateContent(systemPrompt);
      const aiResponse = result.response.text();

      // 4. Lưu vào Database
      const chatLog = this.chatRepo.create({
        sessionId,
        question: userQuestion,
        answer: aiResponse,
      });
      await this.chatRepo.save(chatLog);

      return aiResponse;
    } catch (error) {
      console.error('Lỗi AI:', error);
      return 'Xin lỗi, hệ thống đang bận một chút. Bạn vui lòng thử lại sau nhé!';
    }
  }
}
