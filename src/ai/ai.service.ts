import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatEntity } from '../entities/chat.entity'; // Đảm bảo đúng đường dẫn
import { KnowledgeEntity } from '../entities/knowledge.entity'; // Đảm bảo đúng đường dẫn

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

  // Thêm hàm lấy Vector từ Google
  async getEmbedding(text: string): Promise<number[]> {
    try {
      // 1. Luôn thêm tiền tố 'models/'
      // 2. Đảm bảo dùng đúng tên 'text-embedding-004'
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-embedding-2-preview',
      });

      const result = await model.embedContent(text);
      const embedding = result.embedding;

      return embedding.values;
    } catch (error) {
      console.error('Lỗi khi dùng bản 004:', error.message);
      // Nếu vẫn lỗi, đây là phương án dự phòng (fallback) để demo không bị chết
      const backupModel = this.genAI.getGenerativeModel({
        model: 'models/embedding-001',
      });
      const backupResult = await backupModel.embedContent(text);
      return backupResult.embedding.values;
    }
  }

  async addKnowledge(title: string, content: string) {
    const vector = await this.getEmbedding(content); // Biến chữ thành số
    const newK = this.knowledgeRepo.create({
      title,
      content,
      embedding: vector,
    });
    return await this.knowledgeRepo.save(newK);
  }

  async getAllKnowledge() {
    return await this.knowledgeRepo.find({
      order: { id: 'DESC' }, // Hiện cái mới nhất lên đầu
    });
  }

  // --- Chức năng Chat có bộ nhớ và kiến thức ---

  async handleChat(userQuestion: string, sessionId: string = 'guest-session') {
    try {
      // BƯỚC 1: Biến câu hỏi của người dùng thành Vector (Embedding)
      const embeddingModel = this.genAI.getGenerativeModel({
        model: 'gemini-embedding-2-preview',
      });
      const embeddingResult = await embeddingModel.embedContent(userQuestion);
      const userVector = embeddingResult.embedding.values;

      // BƯỚC 2: Tìm kiếm Semantic Search trong Postgres
      // Chúng ta dùng queryBuilder để sử dụng toán tử <=> của pgvector
      // Chỉ lấy ra 3 mẩu kiến thức có điểm tương đồng cao nhất
      const nearestKnowledge = await this.knowledgeRepo
        .createQueryBuilder('k')
        .select(['k.title', 'k.content'])
        .orderBy('k.embedding <=> :vector', 'ASC') // Tìm khoảng cách vector ngắn nhất
        .setParameter('vector', JSON.stringify(userVector))
        .limit(3)
        .getMany();

      // Chuyển danh sách kiến thức tìm được thành text để đưa vào Prompt
      const context =
        nearestKnowledge.length > 0
          ? nearestKnowledge.map((k) => `- ${k.title}: ${k.content}`).join('\n')
          : 'Không có dữ liệu cụ thể trong bộ nhớ.';

      // BƯỚC 3: Lấy lịch sử 5 câu gần nhất (Memory)
      const history = await this.chatRepo.find({
        where: { sessionId },
        order: { createdAt: 'DESC' },
        take: 5,
      });

      const historyText = history
        .reverse()
        .map((h) => `Người dùng: ${h.question}\nAI: ${h.answer}`)
        .join('\n');

      // BƯỚC 4: Xây dựng Prompt nâng cao
      //   const systemPrompt = `
      //   Bạn là tư vấn viên tuyển sinh chuyên nghiệp của VTI Academy.
      //   Dựa trên KIẾN THỨC NỘI BỘ được cung cấp (đây là những thông tin liên quan nhất đến câu hỏi), hãy trả lời người dùng.

      //   KIẾN THỨC NỘI BỘ LIÊN QUAN:
      //   ${context}

      //   LỊCH SỬ CHAT GẦN ĐÂY (Để hiểu ngữ cảnh nếu người dùng hỏi câu tiếp nối):
      //   ${historyText}

      //   CÂU HỎI HIỆN TẠI: ${userQuestion}

      //   TRẢ LỜI: (Thân thiện, chuyên nghiệp, bám sát kiến thức nội bộ)
      // `;

      const systemPrompt = `
  Bạn là tư vấn viên tuyển sinh chuyên nghiệp của VTI Academy.
  
  QUY TẮC TRẢ LỜI:
  1. Nếu người dùng hỏi chung chung (ví dụ: "có khóa nào không code không?", "học phí thế nào?"), bạn chỉ được LIỆT KÊ TÊN các lựa chọn phù hợp và hỏi xem họ muốn chi tiết về cái nào. 
  2. Tuyệt đối KHÔNG trả lời toàn bộ nội dung chi tiết (lộ trình, học phí, thời gian) ngay lập tức trừ khi người dùng chỉ đích danh 1 khóa học cụ thể.
  3. Trả lời ngắn gọn, thân thiện và mang tính gợi mở.

  KIẾN THỨC NỘI BỘ LIÊN QUAN:
  ${context}

  LỊCH SỬ CHAT GẦN ĐÂY:
  ${historyText}

  CÂU HỎI HIỆN TẠI: ${userQuestion}
  
  TRẢ LỜI: (Thực hiện đúng quy tắc trên)
`;

      // BƯỚC 5: Gọi AI Gemini tạo câu trả lời
      const result = await this.model.generateContent(systemPrompt);
      const aiResponse = result.response.text();

      // BƯỚC 6: Lưu lịch sử vào Database
      const chatLog = this.chatRepo.create({
        sessionId,
        question: userQuestion,
        answer: aiResponse,
      });
      await this.chatRepo.save(chatLog);

      return aiResponse;
    } catch (error) {
      console.error('Lỗi hệ thống RAG:', error);
      return 'Xin lỗi, tôi gặp chút trục trặc khi truy xuất dữ liệu. Bạn có thể hỏi lại được không?';
    }
  }

  // async handleChat(userQuestion: string, sessionId: string = 'guest-session') {
  //   // 1. Lấy kiến thức thực tế từ DB
  //   const knowledgeBase = await this.knowledgeRepo.find();
  //   const context = knowledgeBase
  //     .map((k) => `- ${k.title}: ${k.content}`)
  //     .join('\n');

  //   // 2. Lấy lịch sử 5 câu gần nhất để AI "nhớ" ngữ cảnh
  //   const history = await this.chatRepo.find({
  //     where: { sessionId },
  //     order: { createdAt: 'DESC' },
  //     take: 5,
  //   });

  //   // Đảo ngược lại để đúng thứ tự thời gian
  //   const historyText = history
  //     .reverse()
  //     .map((h) => `Người dùng: ${h.question}\nAI: ${h.answer}`)
  //     .join('\n');

  //   // 3. Xây dựng Prompt nâng cao (RAG + Memory)
  //   const systemPrompt = `
  //     Bạn là tư vấn viên tuyển sinh chuyên nghiệp của VTI Academy.
  //     Sử dụng KIẾN THỨC NỘI BỘ dưới đây để trả lời câu hỏi.
  //     Nếu câu hỏi liên quan đến nội dung trong LỊCH SỬ CHAT, hãy trả lời tiếp nối ngữ cảnh đó.

  //     KIẾN THỨC NỘI BỘ:
  //     ${context}

  //     LỊCH SỬ CHAT GẦN ĐÂY:
  //     ${historyText}

  //     CÂU HỎI HIỆN TẠI: ${userQuestion}

  //     TRẢ LỜI: (Hãy trả lời thân thiện, ngắn gọn và chính xác)
  //   `;

  //   try {
  //     const result = await this.model.generateContent(systemPrompt);
  //     const aiResponse = result.response.text();

  //     // 4. Lưu vào Database
  //     const chatLog = this.chatRepo.create({
  //       sessionId,
  //       question: userQuestion,
  //       answer: aiResponse,
  //     });
  //     await this.chatRepo.save(chatLog);

  //     return aiResponse;
  //   } catch (error) {
  //     console.error('Lỗi AI:', error);
  //     return 'Xin lỗi, hệ thống đang bận một chút. Bạn vui lòng thử lại sau nhé!';
  //   }
  // }
}
