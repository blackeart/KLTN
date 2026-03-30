import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Render,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateCourseClassDto } from './dto/create-course-class.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Course Management - Quản lý khóa học')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get('view')
  @Render('course') // Render file course.hbs
  async getCourseView() {
    const courses = await this.courseService.findAllCourses();
    return { courses }; // Truyền danh sách khóa học sang file .hbs
  }

  @Post()
  @ApiOperation({ summary: 'Tạo khóa học mới (Tổng quan)' })
  createCourse(@Body() dto: CreateCourseDto) {
    return this.courseService.createCourse(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả khóa học' })
  findAll() {
    return this.courseService.findAllCourses();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết khóa học và các lớp học' })
  findOne(@Param('id') id: number) {
    return this.courseService.getCourseDetails(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Sửa thông tin khóa học' })
  update(@Param('id') id: number, @Body() dto: Partial<CreateCourseDto>) {
    return this.courseService.updateCourse(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa khóa học' })
  remove(@Param('id') id: number) {
    return this.courseService.deleteCourse(id);
  }

  // --- ENDPOINTS CHO LỚP HỌC (CLASS) ---

  @Post('class')
  @ApiOperation({ summary: 'Tạo lớp học mới cho một khóa học' })
  createClass(@Body() dto: CreateCourseClassDto) {
    return this.courseService.createClass(dto);
  }

  @Delete('class/:id')
  @ApiOperation({ summary: 'Xóa lớp học' })
  removeClass(@Param('id') id: number) {
    return this.courseService.deleteClass(id);
  }

  @Get('class/all')
  @ApiOperation({ summary: 'Lấy danh sách tất cả các lớp học hiện có' })
  findAllClasses() {
    return this.courseService.findAllClasses();
  }

  @Get('class/:id')
  @ApiOperation({ summary: 'Lấy chi tiết một lớp học bằng ID' })
  findOneClass(@Param('id') id: number) {
    return this.courseService.findOneClass(id);
  }

  @Put('class/:id')
  @ApiOperation({
    summary: 'Cập nhật thông tin lớp học (Ngày, giá, khuyến mãi...)',
  })
  updateClass(
    @Param('id') id: number,
    @Body() dto: Partial<CreateCourseClassDto>,
  ) {
    return this.courseService.updateClass(id, dto);
  }

  @Get('detail/:id')
  @Render('course-detail') // Thêm dòng này để NestJS biết phải vẽ file .hbs nào
  async getCourseDetail(@Param('id') id: number) {
    const course = await this.courseService.findOne(id);

    // Dữ liệu trả về sẽ được map trực tiếp vào các biến {{course.xxx}} trong file hbs
    return { course };
  }
}
