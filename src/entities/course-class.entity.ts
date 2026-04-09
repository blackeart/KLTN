import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseEntity } from './course.entity';

@Entity('course_classes')
export class CourseClassEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'class_name' })
  className: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate: string;

  @Column({ type: 'date', name: 'end_date' })
  endDate: string;

  @Column({ nullable: true, default: '2-4-6' })
  schedule: string;

  @Column({ type: 'decimal', precision: 12, scale: 0, name: 'base_price' })
  basePrice: number;

  @Column({ type: 'int', default: 0, name: 'discount_percentage' })
  discountPercentage: number;

  @Column({
    type: 'vector',
    length: 768,
    nullable: true,
  })
  embedding: number[];

  @ManyToOne(() => CourseEntity, (course) => course.classes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' }) // Đổi tên cột khóa ngoại trong DB
  course: CourseEntity;
}
