let currentCourseId = null;

// 1. Đóng/Mở Modal
function openModal(mode, id = null) {
  const modal = document.getElementById('courseModal');
  const form = document.getElementById('courseForm');

  form.reset(); // Xóa các input text đơn giản
  document.getElementById('curriculum-area').innerHTML = ''; // Xóa trắng curriculum động
  currentCourseId = id;

  if (mode === 'add') {
    document.getElementById('modalTitle').innerText = 'Thêm khóa học mới';
    modal.style.display = 'block';
  } else {
    document.getElementById('modalTitle').innerText = 'Chỉnh sửa khóa học';
    // Chú ý: Đổi tên ở đây cho khớp với hàm editCourse bên dưới
    editCourse(id);
    modal.style.display = 'block';
  }
}

function closeModal() {
  document.getElementById('courseModal').style.display = 'none';
}

// 2. Thêm Module động (Dùng cho nút bấm "Thêm Module" thủ công)
function addModule() {
  const container = document.getElementById('curriculum-area');
  const moduleId = `module-${Date.now()}`;

  const moduleHTML = `
        <div class="module-item" id="${moduleId}">
            <div class="module-header">
                <input type="text" placeholder="Tên Module" class="module-name-input">
                <button type="button" class="btn-remove" onclick="removeElement('${moduleId}')">Xóa Module</button>
            </div>
            <div class="days-area" id="${moduleId}-days"></div>
            <button type="button" class="btn-add-day" onclick="addDay('${moduleId}-days')">+ Thêm Ngày</button>
        </div>
    `;
  container.insertAdjacentHTML('beforeend', moduleHTML);
}

// 3. Thêm Day động (Dùng cho nút bấm "Thêm Ngày" thủ công)
function addDay(containerId) {
  const container = document.getElementById(containerId);
  const dayId = `day-${Date.now() + Math.random()}`;

  const dayHTML = `
        <div class="day-input-group" id="${dayId}">
            <input type="text" placeholder="Tiêu đề ngày" class="day-title-input">
            <textarea placeholder="Mỗi bài học 1 dòng" class="lessons-input"></textarea>
            <button type="button" class="btn-remove" onclick="removeElement('${dayId}')">Xóa ngày</button>
        </div>
    `;
  container.insertAdjacentHTML('beforeend', dayHTML);
}

function removeElement(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// 4. Thu thập dữ liệu từ Form
function getFormData() {
  const splitLines = (id) => {
    const val = document.getElementById(id).value;
    return val ? val.split('\n').filter((l) => l.trim() !== '') : [];
  };

  const curriculum = [];
  document.querySelectorAll('.module-item').forEach((mod) => {
    const days = [];
    mod.querySelectorAll('.day-input-group').forEach((day) => {
      days.push({
        dayTitle: day.querySelector('.day-title-input').value,
        lessons: day
          .querySelector('.lessons-input')
          .value.split('\n')
          .filter((l) => l.trim() !== ''),
      });
    });
    curriculum.push({
      moduleName: mod.querySelector('.module-name-input').value,
      days: days,
    });
  });

  return {
    name: document.getElementById('courseName').value,
    description: document.getElementById('courseDescription').value,
    images: splitLines('courseImages'),
    targetAudience: splitLines('courseTarget'),
    careerPath: splitLines('courseCareer'),
    benefits: splitLines('courseBenefits'),
    curriculum: curriculum,
  };
}

// 5. Gửi API
document.getElementById('courseForm').onsubmit = async (e) => {
  e.preventDefault();
  const data = getFormData();
  const method = currentCourseId ? 'PUT' : 'POST';
  const url = currentCourseId ? `/courses/${currentCourseId}` : '/courses';

  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert('Lưu khóa học thành công!');
      location.reload();
    } else {
      const err = await response.json();
      alert('Lỗi: ' + (err.message || 'Không thể lưu'));
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// 6. Xóa khóa học
async function deleteCourse(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa khóa học này?')) return;
  try {
    const response = await fetch(`/courses/${id}`, { method: 'DELETE' });
    if (response.ok) location.reload();
    else alert('Không thể xóa khóa học');
  } catch (err) {
    console.error(err);
  }
}

// 7. Load dữ liệu khi Edit (Sử dụng hàm của bạn đã viết)
async function editCourse(id) {
  try {
    const response = await fetch(`/courses/${id}`);
    if (!response.ok) throw new Error('Không thể lấy dữ liệu khóa học');
    const course = await response.json();

    // Điền dữ liệu
    document.getElementById('courseName').value = course.name;
    document.getElementById('courseDescription').value = course.description;
    document.getElementById('courseImages').value = course.images
      ? course.images.join('\n')
      : '';
    document.getElementById('courseTarget').value =
      course.targetAudience.join('\n');
    document.getElementById('courseCareer').value =
      course.careerPath.join('\n');
    document.getElementById('courseBenefits').value =
      course.benefits.join('\n');

    // Render Curriculum
    const curriculumArea = document.getElementById('curriculum-area');
    curriculumArea.innerHTML = '';

    if (course.curriculum && course.curriculum.length > 0) {
      course.curriculum.forEach((moduleData) => {
        renderModuleWithData(moduleData);
      });
    }
  } catch (error) {
    alert(error.message);
  }
}

function renderModuleWithData(moduleData) {
  const container = document.getElementById('curriculum-area');
  const moduleId = `module-${Date.now() + Math.random()}`;
  const moduleHTML = `
        <div class="module-item" id="${moduleId}">
            <div class="module-header">
                <input type="text" class="module-name-input" value="${moduleData.moduleName}" placeholder="Tên Module">
                <button type="button" class="btn-remove" onclick="removeElement('${moduleId}')">Xóa Module</button>
            </div>
            <div class="days-area" id="${moduleId}-days"></div>
            <button type="button" class="btn-add-day" onclick="addDay('${moduleId}-days')">+ Thêm Ngày</button>
        </div>
    `;
  container.insertAdjacentHTML('beforeend', moduleHTML);
  if (moduleData.days) {
    moduleData.days.forEach((dayData) =>
      renderDayWithData(`${moduleId}-days`, dayData),
    );
  }
}

function renderDayWithData(containerId, dayData) {
  const container = document.getElementById(containerId);
  const dayId = `day-${Date.now() + Math.random()}`;
  const dayHTML = `
        <div class="day-input-group" id="${dayId}">
            <input type="text" class="day-title-input" value="${dayData.dayTitle}" placeholder="Tiêu đề ngày">
            <textarea class="lessons-input" placeholder="Mỗi bài học 1 dòng">${dayData.lessons.join('\n')}</textarea>
            <button type="button" class="btn-remove" onclick="removeElement('${dayId}')">Xóa</button>
        </div>
    `;
  container.insertAdjacentHTML('beforeend', dayHTML);
}

function filterCourses() {
  const input = document.getElementById('adminSearch');
  const filter = input.value.toLowerCase();
  const table = document.getElementById('coursesTable');
  const tr = table.getElementsByClassName('course-row');

  for (let i = 0; i < tr.length; i++) {
    // Lấy cột tên khóa học (cột thứ 2 - index 1)
    const nameColumn = tr[i].getElementsByClassName('course-name')[0];
    if (nameColumn) {
      const txtValue = nameColumn.textContent || nameColumn.innerText;
      if (txtValue.toLowerCase().indexOf(filter) > -1) {
        tr[i].style.display = '';
      } else {
        tr[i].style.display = 'none';
      }
    }
  }
}

// 1. Toggle danh sách lớp
function toggleClasses(courseId) {
  const container = document.getElementById(`class-container-${courseId}`);
  if (container.style.display === 'none') {
    container.style.display = 'table-row';
    renderClasses(courseId);
  } else {
    container.style.display = 'none';
  }
}

// 2. Fetch và Render danh sách lớp
async function renderClasses(courseId) {
  const response = await fetch(`/courses/${courseId}`); // API lấy chi tiết khóa học kèm classes
  const course = await response.json();
  const tbody = document.getElementById(`class-list-${courseId}`);

  tbody.innerHTML =
    course.classes
      .map(
        (cls) => `
        <tr>
            <td>${cls.className}</td>
            <td>${cls.startDate}</td>
            <td>${cls.endDate}</td>
            <td>${Number(cls.basePrice).toLocaleString()}đ</td>
            <td>${cls.discountPercentage}%</td>
            <td>
                <button class="btn-edit" onclick="openClassModal('edit', ${courseId}, ${JSON.stringify(cls).replace(/"/g, '&quot;')})">Sửa</button>
                <button class="btn-delete" onclick="deleteClass(${cls.id})">Xóa</button>
            </td>
        </tr>
    `,
      )
      .join('') ||
    '<tr><td colspan="6" style="text-align:center">Chưa có lớp nào</td></tr>';
}

// 3. Xử lý Modal Lớp học
// function openClassModal(mode, courseId, classData = null) {
//   document.getElementById('targetCourseId').value = courseId;
//   document.getElementById('classModal').style.display = 'block';
//   const form = document.getElementById('classForm');
//   form.reset();

//   if (mode === 'edit' && classData) {
//     document.getElementById('currentClassId').value = classData.id;
//     document.getElementById('className').value = classData.className;
//     document.getElementById('startDate').value = classData.startDate;
//     document.getElementById('endDate').value = classData.endDate;
//     document.getElementById('basePrice').value = classData.basePrice;
//     document.getElementById('discountPercentage').value =
//       classData.discountPercentage;
//   }
// }

function openClassModal(mode, courseId, classData = null) {
  document.getElementById('targetCourseId').value = courseId;
  document.getElementById('classModal').style.display = 'block';
  const form = document.getElementById('classForm');

  // 1. Reset form về trạng thái trống
  form.reset();
  document.getElementById('currentClassId').value = '';

  // 2. Quan trọng: Reset toàn bộ checkbox lịch học về trạng thái chưa tích
  document
    .querySelectorAll('input[name="scheduleDay"]')
    .forEach((cb) => (cb.checked = false));

  if (mode === 'edit' && classData) {
    document.getElementById('currentClassId').value = classData.id;
    document.getElementById('className').value = classData.className;

    // Format lại ngày tháng (nếu dữ liệu từ DB là định dạng ISO YYYY-MM-DD...)
    if (classData.startDate)
      document.getElementById('startDate').value =
        classData.startDate.split('T')[0];
    if (classData.endDate)
      document.getElementById('endDate').value =
        classData.endDate.split('T')[0];

    document.getElementById('basePrice').value = classData.basePrice;
    document.getElementById('discountPercentage').value =
      classData.discountPercentage;

    // --- BỔ SUNG: Tích lại các checkbox dựa trên chuỗi schedule (VD: "2-4-6") ---
    if (classData.schedule) {
      const days = classData.schedule.split('-'); // Tách "2-4-6" thành ["2", "4", "6"]
      days.forEach((day) => {
        const checkbox = document.querySelector(
          `input[name="scheduleDay"][value="${day}"]`,
        );
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    }
    // --------------------------------------------------------------------------
  }
}

function closeClassModal() {
  document.getElementById('classModal').style.display = 'none';
  document.getElementById('currentClassId').value = '';
}

// 4. Submit Form Lớp học
// admin.js

// document.getElementById('classForm').onsubmit = async (e) => {
//   e.preventDefault();

//   const courseId = document.getElementById('targetCourseId').value;
//   const classId = document.getElementById('currentClassId').value;

//   const payload = {
//     className: document.getElementById('className').value,
//     startDate: document.getElementById('startDate').value,
//     endDate: document.getElementById('endDate').value,
//     basePrice: Number(document.getElementById('basePrice').value),
//     discountPercentage: Number(
//       document.getElementById('discountPercentage').value,
//     ),
//     courseId: Number(courseId),
//   };

//   // CHỈNH SỬA TẠI ĐÂY ĐỂ KHỚP VỚI CONTROLLER CỦA BẠN
//   // 1. Nếu có classId -> Dùng phương thức PUT và đường dẫn /courses/class/:id
//   // 2. Nếu không có -> Dùng POST và đường dẫn /courses/class
//   const method = classId ? 'PUT' : 'POST';
//   const url = classId ? `/courses/class/${classId}` : '/courses/class';

//   console.log(`Đang gửi ${method} tới ${url}`, payload);

//   try {
//     const response = await fetch(url, {
//       method: method,
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload),
//     });

//     if (response.ok) {
//       alert('Lưu thông tin lớp học thành công!');
//       closeClassModal();
//       // Gọi lại hàm render để cập nhật danh sách lớp ngay lập tức
//       if (typeof renderClasses === 'function') {
//         renderClasses(courseId);
//       } else {
//         location.reload(); // Sơ cua nếu bạn chưa viết hàm render
//       }
//     } else {
//       const err = await response.json();
//       alert('Lỗi: ' + (err.message || 'Không thể lưu lớp học'));
//     }
//   } catch (error) {
//     console.error('Lỗi kết nối:', error);
//     alert('Lỗi kết nối server!');
//   }
// };

document.getElementById('classForm').onsubmit = async (e) => {
  e.preventDefault();

  const courseId = document.getElementById('targetCourseId').value;
  const classId = document.getElementById('currentClassId').value;

  // --- BỔ SUNG: Lấy dữ liệu từ checkbox lịch học ---
  const selectedDays = Array.from(
    document.querySelectorAll('input[name="scheduleDay"]:checked'),
  ).map((cb) => cb.value);
  const scheduleString = selectedDays.join('-'); // Kết quả: "2-4-6" hoặc "7-CN"
  // ------------------------------------------------

  const payload = {
    className: document.getElementById('className').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    schedule: scheduleString, // ĐƯA DỮ LIỆU VÀO ĐÂY
    basePrice: Number(document.getElementById('basePrice').value),
    discountPercentage: Number(
      document.getElementById('discountPercentage').value,
    ),
    courseId: Number(courseId),
  };

  const method = classId ? 'PUT' : 'POST';
  const url = classId ? `/courses/class/${classId}` : '/courses/class';

  console.log(`Đang gửi ${method} tới ${url}`, payload); // Hãy check Console xem có 'schedule' chưa

  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert('Lưu thông tin lớp học thành công!');
      closeClassModal();
      location.reload();
    } else {
      const err = await response.json();
      alert('Lỗi: ' + (err.message || 'Không thể lưu lớp học'));
    }
  } catch (error) {
    console.error('Lỗi kết nối:', error);
    alert('Lỗi kết nối server!');
  }
};
