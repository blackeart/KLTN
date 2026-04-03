import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from '../entities/course.entity';
import { CourseClassEntity } from '../entities/course-class.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateCourseClassDto } from './dto/create-course-class.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AiService } from 'src/ai/ai.service';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(CourseEntity)
    private courseRepo: Repository<CourseEntity>,
    @InjectRepository(CourseClassEntity)
    private classRepo: Repository<CourseClassEntity>,
    private aiService: AiService, // Giả sử có AI Service để sync embedding
  ) {}

  // --- QUẢN LÝ KHÓA HỌC (COURSE) ---
  async createCourse(dto: CreateCourseDto) {
    const course = this.courseRepo.create(dto);
    const newCourse = await this.courseRepo.save(course);
    await this.aiService.syncCourseToVector(newCourse.id);
    return newCourse;
  }

  async findAllCourses() {
    return await this.courseRepo.find({ relations: ['classes'] });
  }

  async updateCourse(id: number, dto: Partial<CreateCourseDto>) {
    await this.courseRepo.update(id, dto);
    await this.aiService.syncCourseToVector(id);
    return this.courseRepo.findOne({ where: { id } });
  }

  // courses.service.ts
  // async update(id: number, updateCourseDto: UpdateCourseDto) {
  //   // preload sẽ tìm theo id, sau đó ghi đè các field từ updateCourseDto vào
  //   const course = await this.courseRepo.preload({
  //     id: +id,
  //     ...updateCourseDto,
  //   });

  //   if (!course) {
  //     throw new NotFoundException(`Không tìm thấy khóa học có ID là ${id}`);
  //   }

  //   return this.courseRepo.save(course);
  // }
  async update(id: number, updateCourseDto: UpdateCourseDto) {
    // 1. Preload để chuẩn bị dữ liệu cập nhật
    const course = await this.courseRepo.preload({
      id: +id,
      ...updateCourseDto,
    });

    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học có ID là ${id}`);
    }

    // 2. Lưu vào Database trước để đảm bảo dữ liệu mới nhất đã nằm trong bảng
    const savedCourse = await this.courseRepo.save(course);

    // 3. Kích hoạt AI đồng bộ lại Vector (Embedding)
    // Việc này giúp AI "đọc" lại toàn bộ thông tin mới nhất bao gồm cả Course và các Class liên quan
    try {
      await this.aiService.syncCourseToVector(savedCourse.id);
      console.log(`[AI Sync] Đã cập nhật Vector cho khóa học ID: ${id}`);
    } catch (error) {
      // Chúng ta dùng try-catch ở đây để nếu AI lỗi thì DB vẫn đã lưu xong, không làm chết luồng chính
      console.error(
        `[AI Sync Error] Lỗi khi tạo embedding cho khóa học ${id}:`,
        error instanceof Error ? error.message : String(error),
      );
    }

    return savedCourse;
  }

  async deleteCourse(id: number) {
    return await this.courseRepo.delete(id);
  }

  // --- QUẢN LÝ LỚP HỌC (COURSE CLASS) ---
  async createClass(dto: CreateCourseClassDto) {
    const { courseId, ...classData } = dto;
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Không tìm thấy khóa học gốc');

    const newClass = this.classRepo.create({
      ...classData,
      course,
    });
    return await this.classRepo.save(newClass);
  }

  async deleteClass(id: number) {
    return await this.classRepo.delete(id);
  }

  // Lấy chi tiết kèm tính toán giá
  async getCourseDetails(id: number) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['classes'],
    });

    if (!course) throw new NotFoundException('Khóa học không tồn tại');

    // Map thêm trường final_price để AI dễ đọc
    const classesWithFinalPrice = course.classes.map((c) => ({
      ...c,
      finalPrice: Number(c.basePrice) * (1 - c.discountPercentage / 100),
    }));

    return { ...course, classes: classesWithFinalPrice };
  }

  async findAllClasses() {
    return await this.classRepo.find({
      relations: ['course'],
      order: { startDate: 'ASC' }, // Sắp xếp theo ngày khai giảng
    });
  }

  // Lấy chi tiết 1 lớp học cụ thể
  async findOneClass(id: number) {
    const courseClass = await this.classRepo.findOne({
      where: { id },
      relations: ['course'],
    });
    if (!courseClass) throw new NotFoundException('Không tìm thấy lớp học');

    // Tính toán giá cuối cùng để trả về
    const finalPrice =
      Number(courseClass.basePrice) *
      (1 - courseClass.discountPercentage / 100);
    return { ...courseClass, finalPrice };
  }

  // Cập nhật thông tin lớp học
  async updateClass(id: number, dto: Partial<CreateCourseClassDto>) {
    const { courseId, ...updateData } = dto;

    const courseClass = await this.classRepo.findOne({ where: { id } });
    if (!courseClass)
      throw new NotFoundException('Không tìm thấy lớp học để sửa');

    // Nếu có đổi khóa học gốc (courseId)
    if (courseId) {
      const course = await this.courseRepo.findOne({ where: { id: courseId } });
      if (!course) throw new NotFoundException('Khóa học mới không tồn tại');
      courseClass.course = course;
    }

    // Ghi đè các dữ liệu mới
    Object.assign(courseClass, updateData);
    return await this.classRepo.save(courseClass);
  }

  async findOne(id: number) {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với id ${id}`);
    }
    return course;
  }
}
