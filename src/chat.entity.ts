import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('chat_history') // Tên bảng trong Postgres
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question: string; // Câu hỏi của thí sinh

  @Column({ type: 'text', nullable: true })
  answer: string; // Câu trả lời của AI

  @CreateDateColumn()
  createdAt: Date; // Thời gian hỏi
}
