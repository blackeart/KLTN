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
  // async createClass(dto: CreateCourseClassDto) {
  //   const { courseId, ...classData } = dto;
  //   const course = await this.courseRepo.findOne({ where: { id: courseId } });
  //   if (!course) throw new NotFoundException('Không tìm thấy khóa học gốc');

  //   const newClass = this.classRepo.create({
  //     ...classData,
  //     course,
  //   });
  //   return await this.classRepo.save(newClass);
  // }

  async createClass(dto: CreateCourseClassDto) {
    const { courseId, ...classData } = dto;

    // 1. Kiểm tra khóa học gốc
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Không tìm thấy khóa học gốc');

    // 2. Tạo và lưu lớp học mới
    const newClass = this.classRepo.create({
      ...classData,
      course,
    });
    const savedClass = await this.classRepo.save(newClass);

    // 3. CẬP NHẬT VECTOR CHO COURSE
    // Sau khi lớp đã lưu vào DB, ta bảo AI Service đọc lại Course này
    // để lấy đầy đủ danh sách lớp (bao gồm cả lớp vừa tạo) và tạo Vector mới.
    try {
      await this.aiService.syncCourseToVector(courseId);
      console.log(
        `[AI Sync] Đã cập nhật lại Vector cho Course ID: ${courseId} do có lớp mới.`,
      );
    } catch (error) {
      // Log lỗi nhưng không làm gián đoạn việc trả về kết quả cho User
      console.error(
        `[AI Sync Error] Không thể cập nhật Vector: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return savedClass;
  }

  async deleteClass(id: number) {
    return await this.classRepo.delete(id);
  }

  // Lấy chi tiết kèm tính toán giá
  // async getCourseDetails(id: number) {
  //   const course = await this.courseRepo.findOne({
  //     where: { id },
  //     relations: ['classes'],
  //   });

  //   if (!course) throw new NotFoundException('Khóa học không tồn tại');

  //   // Map thêm trường final_price để AI dễ đọc
  //   const classesWithFinalPrice = course.classes.map((c) => ({
  //     ...c,
  //     finalPrice: Number(c.basePrice) * (1 - c.discountPercentage / 100),
  //   }));

  //   return { ...course, classes: classesWithFinalPrice };
  // }

  // course.service.ts
  // course.service.ts
  async getCourseDetails(id: number, startDate?: string, endDate?: string) {
    const query = this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.classes', 'class')
      .where('course.id = :id', { id });

    // Nếu có truyền ngày vào thì lọc ngay trong Query
    if (startDate && endDate) {
      query.andWhere('class.startDate BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    } else if (startDate) {
      query.andWhere('class.startDate >= :start', { start: startDate });
    }

    const course = await query.getOne();
    if (!course) throw new NotFoundException('Không tìm thấy khóa học');

    // Logic tính finalPrice giữ nguyên...
    return course;
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
  // async updateClass(id: number, dto: Partial<CreateCourseClassDto>) {
  //   const { courseId, ...updateData } = dto;

  //   const courseClass = await this.classRepo.findOne({ where: { id } });
  //   if (!courseClass)
  //     throw new NotFoundException('Không tìm thấy lớp học để sửa');

  //   // Nếu có đổi khóa học gốc (courseId)
  //   if (courseId) {
  //     const course = await this.courseRepo.findOne({ where: { id: courseId } });
  //     if (!course) throw new NotFoundException('Khóa học mới không tồn tại');
  //     courseClass.course = course;
  //   }

  //   // Ghi đè các dữ liệu mới
  //   Object.assign(courseClass, updateData);
  //   return await this.classRepo.save(courseClass);
  // }

  async updateClass(id: number, dto: Partial<CreateCourseClassDto>) {
    const { courseId, ...updateData } = dto;

    // 1. Tìm lớp cũ và lấy kèm thông tin Course hiện tại
    const courseClass = await this.classRepo.findOne({
      where: { id },
      relations: ['course'],
    });
    if (!courseClass)
      throw new NotFoundException('Không tìm thấy lớp học để sửa');

    const oldCourseId = courseClass.course?.id;

    // 2. Nếu có đổi khóa học gốc (chuyển lớp sang khóa khác)
    if (courseId && courseId !== oldCourseId) {
      const newCourse = await this.courseRepo.findOne({
        where: { id: courseId },
      });
      if (!newCourse) throw new NotFoundException('Khóa học mới không tồn tại');
      courseClass.course = newCourse;
    }

    // 3. Ghi đè dữ liệu và lưu
    Object.assign(courseClass, updateData);
    const savedClass = await this.classRepo.save(courseClass);

    // 4. CẬP NHẬT VECTOR (EMBEDDING)
    try {
      // Luôn cập nhật khóa học hiện tại của lớp
      await this.aiService.syncCourseToVector(courseClass.course.id);

      // Nếu lớp này vừa được chuyển từ Khóa học A sang Khóa học B
      // thì phải cập nhật lại cả Khóa học A (vì nó vừa mất đi 1 lớp)
      if (courseId && oldCourseId && courseId !== oldCourseId) {
        await this.aiService.syncCourseToVector(oldCourseId);
      }

      console.log(`[AI Sync] Đã cập nhật Embedding thành công.`);
    } catch (error) {
      console.error(
        `[AI Sync Error] Lỗi cập nhật Vector:`,
        error instanceof Error ? error.message : String(error),
      );
    }

    return savedClass;
  }

  async findOne(id: number) {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với id ${id}`);
    }
    return course;
  }

  // course.service.ts
  async searchCourses(name?: string, startDate?: string, endDate?: string) {
    const query = this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.classes', 'class');

    if (name) query.andWhere('course.name ILIKE :name', { name: `%${name}%` });

    const courses = await query.getMany();

    if (!startDate && !endDate) return courses;

    const filteredResult = courses
      .map((course) => {
        const originalCount = course.classes.length;

        course.classes = course.classes.filter((c) => {
          const d = c.startDate.toString();
          // LOG ĐỂ KIỂM TRA SO SÁNH
          console.log(`So sánh: ${d} với Start: ${startDate}, End: ${endDate}`);

          if (startDate && endDate) return d >= startDate && d <= endDate;
          if (startDate) return d >= startDate;
          if (endDate) return d <= endDate;
          return true;
        });

        console.log(
          `Khóa ${course.name}: Trước lọc ${originalCount} lớp, sau lọc ${course.classes.length} lớp`,
        );
        return course;
      })
      .filter((course) => course.classes.length > 0);

    return filteredResult;
  }
}
