/* public/js/script.js */

// =============================================
// SLIDER - Chỉ chạy nếu trang có slider
// =============================================
const slides = document.querySelectorAll('.slide');
const nextBtn = document.querySelector('.next-btn');
const prevBtn = document.querySelector('.prev-btn');

if (slides.length > 0 && nextBtn && prevBtn) {
  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    if (index >= slides.length) currentSlide = 0;
    if (index < 0) currentSlide = slides.length - 1;
    slides.forEach((slide) => slide.classList.remove('active'));
    slides[currentSlide].classList.add('active');
  }

  function nextSlide() {
    currentSlide++;
    showSlide(currentSlide);
  }

  function prevSlide() {
    currentSlide--;
    showSlide(currentSlide);
  }

  function startInterval() {
    slideInterval = setInterval(nextSlide, 5000);
  }

  function resetInterval() {
    clearInterval(slideInterval);
    startInterval();
  }

  nextBtn.addEventListener('click', () => {
    nextSlide();
    resetInterval();
  });
  prevBtn.addEventListener('click', () => {
    prevSlide();
    resetInterval();
  });

  startInterval();
}

// =============================================
// CHAT - Chỉ chạy nếu trang có chat widget
// =============================================
const chatWindow = document.getElementById('chat-window');
const chatBtn = document.getElementById('chat-btn');
const closeChat = document.getElementById('close-chat');
const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

if (chatBtn && chatWindow) {
  // Đóng/Mở khung chat
  chatBtn.onclick = () => {
    chatWindow.style.display =
      chatWindow.style.display === 'flex' ? 'none' : 'flex';
  };
  closeChat.onclick = () => (chatWindow.style.display = 'none');

  // Hàm thêm tin nhắn vào màn hình
  function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.innerText = text;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Hàm hiệu ứng chạy chữ
  function typeWriter(text, element) {
    let i = 0;
    element.innerText = '';
    function typing() {
      if (i < text.length) {
        element.innerText += text.charAt(i);
        i++;
        chatBody.scrollTop = chatBody.scrollHeight;
        setTimeout(typing, 20);
      }
    }
    typing();
  }

  function renderMarkdown(text) {
    return text
      .replace(/###\s?(.+)/g, '<b>$1</b>') // ### Tiêu đề
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') // **bold**
      .replace(/\*(.+?)\*/g, '<i>$1</i>') // *italic*
      .replace(/\n/g, '<br>'); // xuống dòng
  }

  // Hàm gửi tin nhắn lên Server
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot typing-indicator';
    loadingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(loadingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const response = await fetch('/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const result = await response.json();
      chatBody.removeChild(loadingDiv);

      if (result.success) {
        const botMsgDiv = document.createElement('div');
        botMsgDiv.className = 'message bot';
        botMsgDiv.innerHTML = renderMarkdown(result.data); // ← dùng innerHTML + renderMarkdown
        chatBody.appendChild(botMsgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
      } else {
        appendMessage('bot', 'Có lỗi xảy ra, bạn thử lại nhé!');
      }
    } catch (error) {
      console.error(error);
      if (loadingDiv.parentNode) chatBody.removeChild(loadingDiv);
      appendMessage('bot', 'Không kết nối được với Server.');
    }
  }

  // Bắt sự kiện nhấn nút gửi hoặc Enter
  sendBtn.onclick = sendMessage;
  chatInput.onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };
}

// =============================================
// COUNTDOWN - Chỉ chạy nếu trang có countdown
// =============================================
function startCountdown() {
  const daysEl = document.getElementById('days');
  if (!daysEl) return; // Không có countdown thì thoát

  const durationInMs = 8 * 60 * 60 * 1000 + 7 * 60 * 1000 + 20 * 1000; // 08:07:20
  const endTime = new Date().getTime() + durationInMs;

  const timer = setInterval(() => {
    const distance = endTime - new Date().getTime();

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').innerText = days
      .toString()
      .padStart(2, '0');
    document.getElementById('hours').innerText = hours
      .toString()
      .padStart(2, '0');
    document.getElementById('minutes').innerText = minutes
      .toString()
      .padStart(2, '0');
    document.getElementById('seconds').innerText = seconds
      .toString()
      .padStart(2, '0');

    if (distance < 0) {
      clearInterval(timer);
      ['days', 'hours', 'minutes', 'seconds'].forEach((id) => {
        document.getElementById(id).innerText = '00';
      });
      console.log('Ưu đãi đã hết hạn!');
    }
  }, 1000);
}

// =============================================
// FETCH CLASSES - Chỉ chạy nếu có bảng lớp học
// =============================================
async function fetchClasses() {
  const tableBody = document.getElementById('class-table-body');
  if (!tableBody) return; // Không có bảng thì thoát

  try {
    const response = await fetch('/courses/class/all');
    const classes = await response.json();

    if (!classes || classes.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="7" style="text-align: center;">Hiện chưa có lớp học nào khả dụng.</td></tr>';
      return;
    }

    tableBody.innerHTML = '';

    classes.forEach((cls) => {
      const row = document.createElement('tr');

      const finalPrice = cls.basePrice
        ? new Intl.NumberFormat('vi-VN').format(
            cls.basePrice * (1 - cls.discountPercentage / 100),
          ) + 'đ'
        : 'Liên hệ';

      row.innerHTML = `
        <td><a href="#">${cls.className}</a></td>
        <td>${cls.schedule || '2-4-6'}</td>
        <td>${new Date(cls.startDate).toLocaleDateString('vi-VN')}</td>
        <td>Online + Offline</td>
        <td>Cả nước</td>
        <td>${finalPrice}</td>
        <td><button class="btn-register-small">Đăng ký</button></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Lỗi fetch lớp học:', error);
    tableBody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: red;">Lỗi tải dữ liệu.</td></tr>';
  }
}

function scrollToRegister() {
  document.getElementById('reg-section').scrollIntoView({
    behavior: 'smooth',
  });
}

async function logout() {
  if (!confirm('Bạn có chắc chắn muốn đăng xuất không?')) return;

  try {
    // Gọi API logout lên Server NestJS
    const response = await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Dù kết quả API thế nào, ta cũng xóa trạng thái ở Client và chuyển trang
    window.location.href = '/auth/login';
  } catch (err) {
    console.error('Lỗi khi đăng xuất:', err);
    // Nếu lỗi mạng vẫn ép chuyển về trang login
    window.location.href = '/auth/login';
  }
}

// =============================================
// KHỞI CHẠY KHI DOM SẴN SÀNG
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  startCountdown();
  fetchClasses();
});
