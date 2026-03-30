import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CourseClassEntity } from './course-class.entity';

export interface ICurriculumDay {
  dayTitle: string;
  lessons: string[];
}

export interface ICurriculumModule {
  moduleName: string;
  days: ICurriculumDay[];
}

@Entity('courses')
export class CourseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', name: 'target_audience', default: [] })
  targetAudience: string[];

  @Column({ type: 'jsonb', name: 'career_path', default: [] })
  careerPath: string[];

  @Column({ type: 'jsonb', name: 'benefits', default: [] })
  benefits: string[];

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Column({ type: 'jsonb', default: [] })
  curriculum: ICurriculumModule[];

  @OneToMany(() => CourseClassEntity, (courseClass) => courseClass.course)
  classes: CourseClassEntity[];

  @Column({ type: 'vector', length: 768, nullable: true })
  embedding: number[];
}
