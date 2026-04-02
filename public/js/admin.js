let currentCourseId = null;

// 1. Đóng/Mở Modal
function openModal(mode, id = null) {
  const modal = document.getElementById('courseModal');
  const form = document.getElementById('courseForm');
  form.reset();
  document.getElementById('curriculum-area').innerHTML = '';
  currentCourseId = id;

  if (mode === 'add') {
    document.getElementById('modalTitle').innerText = 'Thêm khóa học mới';
  } else {
    document.getElementById('modalTitle').innerText = 'Chỉnh sửa khóa học';
    loadCourseData(id);
  }
  modal.style.display = 'block';
}

function closeModal() {
  document.getElementById('courseModal').style.display = 'none';
}

// 2. Thêm Module động
function addModule(data = null) {
  const container = document.getElementById('curriculum-area');
  const moduleId = `module-${Date.now()}`;

  const moduleHTML = `
        <div class="module-item" id="${moduleId}">
            <div class="module-header">
                <input type="text" placeholder="Tên Module (VD: Học phần 1...)" 
                       class="module-name-input" value="${data ? data.moduleName : ''}">
                <button type="button" class="btn-remove" onclick="removeElement('${moduleId}')">Xóa Module</button>
            </div>
            <div class="days-area" id="${moduleId}-days"></div>
            <button type="button" class="btn-add-day" onclick="addDay('${moduleId}-days')">+ Thêm Ngày</button>
        </div>
    `;
  container.insertAdjacentHTML('beforeend', moduleHTML);

  // Nếu có dữ liệu cũ (khi Edit), đổ các Day vào
  if (data && data.days) {
    data.days.forEach((day) => addDay(`${moduleId}-days`, day));
  }
}

// 3. Thêm Day động
function addDay(containerId, data = null) {
  const container = document.getElementById(containerId);
  const dayId = `day-${Date.now() + Math.random()}`;

  const dayHTML = `
        <div class="day-input-group" id="${dayId}">
            <input type="text" placeholder="Tiêu đề ngày (VD: Day 1 - Lesson 1)" 
                   class="day-title-input" value="${data ? data.dayTitle : ''}">
            <textarea placeholder="Các bài học (mỗi bài 1 dòng)" 
                      class="lessons-input">${data ? data.lessons.join('\n') : ''}</textarea>
            <button type="button" class="btn-remove" onclick="removeElement('${dayId}')">Xóa ngày</button>
        </div>
    `;
  container.insertAdjacentHTML('beforeend', dayHTML);
}

function removeElement(id) {
  document.getElementById(id).remove();
}

// 4. Thu thập dữ liệu từ Form (Convert to JSON)
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

  // PHẢI KHỚP VỚI CreateCourseDto
  return {
    name: document.getElementById('courseName').value,
    description: document.getElementById('courseDescription').value,
    imageUrl: document.getElementById('courseImageUrl').value, // DTO dùng imageUrl (string)
    targetAudience: splitLines('courseTarget'),
    careerPath: splitLines('courseCareer'),
    benefits: splitLines('courseBenefits'),
    curriculum: curriculum,
  };
}

// 5. Gửi API (Submit Form)
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
      alert('Lỗi: ' + err.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// 6. Xóa khóa học
async function deleteCourse(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa khóa học này?')) return;

  const response = await fetch(`/courses/${id}`, { method: 'DELETE' });
  if (response.ok) {
    location.reload();
  } else {
    alert('Không thể xóa khóa học');
  }
}

// 7. Load dữ liệu khi Edit (Đổ dữ liệu vào Form)
async function editCourse(id) {
  const response = await fetch(`/courses/${id}`);
  const course = await response.json();

  openModal('edit', id);

  document.getElementById('courseName').value = course.name;
  document.getElementById('courseDescription').value = course.description;
  document.getElementById('courseImageUrl').value = course.images[0] || '';
  document.getElementById('courseTarget').value =
    course.targetAudience.join('\n');
  document.getElementById('courseCareer').value = course.careerPath.join('\n');
  document.getElementById('courseBenefits').value = course.benefits.join('\n');

  // Render Curriculum cũ
  if (course.curriculum) {
    course.curriculum.forEach((mod) => addModule(mod));
  }
}
