import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatEntity } from '../entities/chat.entity'; // Đảm bảo đúng đường dẫn
import { KnowledgeEntity } from '../entities/knowledge.entity'; // Đảm bảo đúng đường dẫn
import { CourseEntity } from 'src/entities/course.entity';

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
    @InjectRepository(CourseEntity)
    private courseRepo: Repository<CourseEntity>,
  ) {
    const apiKey = this.configService.get<string>('KEY_AI_GEMINI');
    this.genAI = new GoogleGenerativeAI(apiKey);
    // this.model = this.genAI.getGenerativeModel({
    //   model: 'gemini-3-flash-preview',
    // });
    // this.model = this.genAI.getGenerativeModel({
    //   model: 'gemini-2.5-flash',
    // });
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3.1-pro-preview',
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
      console.error('Lỗi khi dùng bản 004:', (error as Error).message);
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

  //   async handleChat(userQuestion: string, sessionId: string = 'guest-session') {
  //     try {
  //       // BƯỚC 1: Biến câu hỏi của người dùng thành Vector (Embedding)
  //       const embeddingModel = this.genAI.getGenerativeModel({
  //         model: 'gemini-embedding-2-preview',
  //       });
  //       const embeddingResult = await embeddingModel.embedContent(userQuestion);
  //       const userVector = embeddingResult.embedding.values;

  //       // BƯỚC 2: Tìm kiếm Semantic Search trong Postgres
  //       // Chúng ta dùng queryBuilder để sử dụng toán tử <=> của pgvector
  //       // Chỉ lấy ra 3 mẩu kiến thức có điểm tương đồng cao nhất
  //       const nearestKnowledge = await this.knowledgeRepo
  //         .createQueryBuilder('k')
  //         .select(['k.title', 'k.content'])
  //         .orderBy('k.embedding <=> :vector', 'ASC') // Tìm khoảng cách vector ngắn nhất
  //         .setParameter('vector', JSON.stringify(userVector))
  //         .limit(3)
  //         .getMany();

  //       // Chuyển danh sách kiến thức tìm được thành text để đưa vào Prompt
  //       const context =
  //         nearestKnowledge.length > 0
  //           ? nearestKnowledge.map((k) => `- ${k.title}: ${k.content}`).join('\n')
  //           : 'Không có dữ liệu cụ thể trong bộ nhớ.';

  //       // BƯỚC 3: Lấy lịch sử 5 câu gần nhất (Memory)
  //       const history = await this.chatRepo.find({
  //         where: { sessionId },
  //         order: { createdAt: 'DESC' },
  //         take: 5,
  //       });

  //       const historyText = history
  //         .reverse()
  //         .map((h) => `Người dùng: ${h.question}\nAI: ${h.answer}`)
  //         .join('\n');

  //       // BƯỚC 4: Xây dựng Prompt nâng cao
  //       //   const systemPrompt = `
  //       //   Bạn là tư vấn viên tuyển sinh chuyên nghiệp của VTI Academy.
  //       //   Dựa trên KIẾN THỨC NỘI BỘ được cung cấp (đây là những thông tin liên quan nhất đến câu hỏi), hãy trả lời người dùng.

  //       //   KIẾN THỨC NỘI BỘ LIÊN QUAN:
  //       //   ${context}

  //       //   LỊCH SỬ CHAT GẦN ĐÂY (Để hiểu ngữ cảnh nếu người dùng hỏi câu tiếp nối):
  //       //   ${historyText}

  //       //   CÂU HỎI HIỆN TẠI: ${userQuestion}

  //       //   TRẢ LỜI: (Thân thiện, chuyên nghiệp, bám sát kiến thức nội bộ)
  //       // `;

  //       const systemPrompt = `
  //   Bạn là tư vấn viên tuyển sinh chuyên nghiệp của VTI Academy.

  //   QUY TẮC TRẢ LỜI:
  //   1. Nếu người dùng hỏi chung chung (ví dụ: "có khóa nào không code không?", "học phí thế nào?"), bạn chỉ được LIỆT KÊ TÊN các lựa chọn phù hợp và hỏi xem họ muốn chi tiết về cái nào.
  //   2. Tuyệt đối KHÔNG trả lời toàn bộ nội dung chi tiết (lộ trình, học phí, thời gian) ngay lập tức trừ khi người dùng chỉ đích danh 1 khóa học cụ thể.
  //   3. Trả lời ngắn gọn, thân thiện và mang tính gợi mở.

  //   KIẾN THỨC NỘI BỘ LIÊN QUAN:
  //   ${context}

  //   LỊCH SỬ CHAT GẦN ĐÂY:
  //   ${historyText}

  //   CÂU HỎI HIỆN TẠI: ${userQuestion}

  //   TRẢ LỜI: (Thực hiện đúng quy tắc trên)
  // `;

  //       // BƯỚC 5: Gọi AI Gemini tạo câu trả lời
  //       const result = await this.model.generateContent(systemPrompt);
  //       const aiResponse = result.response.text();

  //       // BƯỚC 6: Lưu lịch sử vào Database
  //       const chatLog = this.chatRepo.create({
  //         sessionId,
  //         question: userQuestion,
  //         answer: aiResponse,
  //       });
  //       await this.chatRepo.save(chatLog);

  //       return aiResponse;
  //     } catch (error) {
  //       console.error('Lỗi hệ thống RAG:', error);
  //       return 'Xin lỗi, tôi gặp chút trục trặc khi truy xuất dữ liệu. Bạn có thể hỏi lại được không?';
  //     }
  //   }
  async handleChat(userQuestion: string, sessionId: string = 'guest-session') {
    try {
      // 1. Tạo Vector từ câu hỏi của người dùng
      const userVector = await this.getEmbedding(userQuestion);
      const vectorString = JSON.stringify(userVector);

      // 2. TÌM KIẾM TRÊN BẢNG COURSES (Dữ liệu khóa học & lớp học)
      const nearestCourses = await this.courseRepo
        .createQueryBuilder('c')
        .where('c.embedding IS NOT NULL')
        .orderBy('c.embedding <=> :vector', 'ASC')
        .setParameter('vector', vectorString)
        .limit(2) // Lấy 2 khóa học phù hợp nhất
        .getMany();

      // 3. TÌM KIẾM TRÊN BẢNG KNOWLEDGE (Quy định, FAQ, tin tức)
      const nearestKnowledge = await this.knowledgeRepo
        .createQueryBuilder('k')
        .where('k.embedding IS NOT NULL')
        .orderBy('k.embedding <=> :vector', 'ASC')
        .setParameter('vector', vectorString)
        .limit(2) // Lấy 2 mẩu kiến thức phù hợp nhất
        .getMany();

      // 4. TỔNG HỢP CONTEXT TỪ 2 NGUỒN
      let context = '--- THÔNG TIN KHÓA HỌC & LỚP HỌC ---\n';
      for (const c of nearestCourses) {
        // Gọi hàm formatCourseToText để lấy đầy đủ chi tiết lớp học lồng bên trong
        context += (await this.formatCourseToText(c.id)) + '\n';
      }

      context += '\n--- KIẾN THỨC BỔ TRỢ & QUY ĐỊNH ---\n';
      nearestKnowledge.forEach((k) => {
        context += `- ${k.title}: ${k.content}\n`;
      });

      // 5. LẤY LỊCH SỬ CHAT (Memory)
      const history = await this.chatRepo.find({
        where: { sessionId },
        order: { createdAt: 'DESC' },
        take: 5,
      });
      const historyText = history
        .reverse()
        .map((h) => `Người dùng: ${h.question}\nAI: ${h.answer}`)
        .join('\n');

      // 6. XÂY DỰNG SYSTEM PROMPT
      const systemPrompt = `
Bạn là tư vấn viên chuyên nghiệp của VTI Academy. Hãy sử dụng NGỮ CẢNH được cung cấp để trả lời câu hỏi.

NGỮ CẢNH HỆ THỐNG:
${context}

LỊCH SỬ CHAT:
${historyText}

CÂU HỎI HIỆN TẠI: ${userQuestion}

YÊU CẦU TRẢ LỜI:
- Nếu khách hỏi về học phí/lịch khai giảng: Ưu tiên dữ liệu từ THÔNG TIN KHÓA HỌC.
- Nếu khách hỏi về chính sách/thủ tục: Ưu tiên dữ liệu từ KIẾN THỨC BỔ TRỢ.
- Trả lời thân thiện, ngắn gọn, chuyên nghiệp.`;

      // 7. GỌI GEMINI & LƯU LOG
      const result = await this.model.generateContent(systemPrompt);
      const aiResponse = result.response.text();

      await this.chatRepo.save({
        sessionId,
        question: userQuestion,
        answer: aiResponse,
      });

      return aiResponse;
    } catch (error) {
      console.error('Lỗi RAG Hybrid:', error);
      return 'Xin lỗi, tôi đang gặp khó khăn khi kết nối dữ liệu. Bạn vui lòng thử lại nhé!';
    }
  }

  private async formatCourseToText(courseId: number): Promise<string> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['classes'],
    });

    if (!course) return '';

    let text = `Khóa học: ${course.name}. \n`;
    text += `Mô tả: ${course.description}. \n`;
    text += `Dành cho: ${course.targetAudience.join(', ')}. \n`;
    text += `Lợi ích: ${course.benefits.join(', ')}. \n`;

    // Gom thông tin lộ trình (Curriculum)
    text +=
      `Lộ trình học: ` +
      course.curriculum.map((m) => m.moduleName).join(', ') +
      '. \n';

    // Quan trọng: Gom thông tin các lớp học đang mở
    if (course.classes && course.classes.length > 0) {
      text += `Thông tin các lớp học hiện có: \n`;
      course.classes.forEach((cls) => {
        const finalPrice =
          Number(cls.basePrice) * (1 - cls.discountPercentage / 100);
        text += `- Lớp ${cls.className}: Khai giảng ${cls.startDate}. Học phí gốc ${cls.basePrice}đ, ưu đãi còn ${finalPrice}đ. \n`;
      });
    }

    return text;
  }

  // Hàm cập nhật Vector cho khóa học
  async syncCourseToVector(courseId: number) {
    const fullText = await this.formatCourseToText(courseId);
    const vector = await this.getEmbedding(fullText);

    await this.courseRepo.update(courseId, { embedding: vector });
  }
}
