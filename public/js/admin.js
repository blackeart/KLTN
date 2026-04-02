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
  const method = currentCourseId ? 'PATCH' : 'POST';
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
