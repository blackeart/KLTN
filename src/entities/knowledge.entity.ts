import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('knowledge_base')
export class KnowledgeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  // Cột này sẽ lưu "ý nghĩa" của văn bản dưới dạng dãy số
  @Column({ type: 'vector', precision: 768, nullable: true })
  embedding: number[];
}
