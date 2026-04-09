/* public/js/script.js */
const slides = document.querySelectorAll('.slide');
const nextBtn = document.querySelector('.next-btn');
const prevBtn = document.querySelector('.prev-btn');
let currentSlide = 0;
let slideInterval;

// Hàm hiển thị Slide dựa trên Index
function showSlide(index) {
  // Nếu vượt quá số lượng, quay về 0
  if (index >= slides.length) currentSlide = 0;
  // Nếu nhỏ hơn 0, quay về cuối
  if (index < 0) currentSlide = slides.length - 1;

  // Gỡ bỏ class 'active' khỏi tất cả các slide
  slides.forEach((slide) => slide.classList.remove('active'));
  // Thêm class 'active' vào slide hiện tại
  slides[currentSlide].classList.add('active');
}

// Hàm chuyển đến slide tiếp theo
function nextSlide() {
  currentSlide++;
  showSlide(currentSlide);
}

// Hàm quay về slide trước
function prevSlide() {
  currentSlide--;
  showSlide(currentSlide);
}

// Bắt sự kiện Click cho các nút
nextBtn.addEventListener('click', () => {
  nextSlide();
  resetInterval(); // Bấm nút thì dừng tự động 1 lát
});
prevBtn.addEventListener('click', () => {
  prevSlide();
  resetInterval();
});

// Hàm tự động chạy Slider (mỗi 5 giây)
function startInterval() {
  slideInterval = setInterval(nextSlide, 5000);
}

// Hàm reset thời gian tự động khi người dùng thao tác thủ công
function resetInterval() {
  clearInterval(slideInterval);
  startInterval();
}

// Bắt đầu chạy
startInterval();

const chatWindow = document.getElementById('chat-window');
const chatBtn = document.getElementById('chat-btn'); // Nút xanh tròn
const closeChat = document.getElementById('close-chat');
const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

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
  chatBody.scrollTop = chatBody.scrollHeight; // Cuộn xuống dưới cùng
}

// Hàm gửi tin nhắn lên Server
// async function sendMessage() {
//   const text = chatInput.value.trim();
//   if (!text) return;

//   appendMessage('user', text); // Hiển thị tin nhắn người dùng
//   chatInput.value = '';

//   // Hiển thị trạng thái "đang trả lời..."
//   const loadingDiv = document.createElement('div');
//   loadingDiv.className = 'message bot';
//   loadingDiv.innerText = 'AI đang suy nghĩ...';
//   chatBody.appendChild(loadingDiv);

//   try {
//     const response = await fetch('/chat/ask', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ message: text }),
//     });

//     const result = await response.json();
//     chatBody.removeChild(loadingDiv); // Xóa dòng đang chờ

//     if (result.success) {
//       appendMessage('bot', result.data);
//     } else {
//       appendMessage('bot', 'Có lỗi xảy ra, bạn thử lại nhé!');
//     }
//   } catch (error) {
//     console.error(error);
//     chatBody.removeChild(loadingDiv);
//     appendMessage('bot', 'Không kết nối được với Server.');
//   }
// }
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  chatInput.value = '';

  // --- PHẦN THAY ĐỔI: Tạo hiệu ứng đang nhập ---
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message bot typing-indicator'; // Thêm class typing-indicator
  loadingDiv.innerHTML = '<span></span><span></span><span></span>'; // 3 dấu chấm
  chatBody.appendChild(loadingDiv);
  chatBody.scrollTop = chatBody.scrollHeight; // Cuộn xuống dưới cùng

  try {
    const response = await fetch('/chat/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    const result = await response.json();
    chatBody.removeChild(loadingDiv); // Xóa hiệu ứng sau khi có kết quả

    if (result.success) {
      appendMessage('bot', result.data);
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

function typeWriter(text, element) {
  let i = 0;
  element.innerText = ''; // Xóa chữ cũ
  function typing() {
    if (i < text.length) {
      element.innerText += text.charAt(i);
      i++;
      chatBody.scrollTop = chatBody.scrollHeight;
      setTimeout(typing, 20); // Tốc độ chạy chữ 20ms
    }
  }
  typing();
}

function startCountdown() {
  // Thiết lập thời gian kết thúc: 8 giờ kể từ hiện tại
  const durationInMilliseconds = 8 * 60 * 60 * 1000 + 7 * 60 * 1000 + 20 * 1000; // 08:07:20
  const endTime = new Date().getTime() + durationInMilliseconds;

  const timer = setInterval(() => {
    const now = new Date().getTime();
    const distance = endTime - now;

    // Tính toán Ngày, Giờ, Phút, Giây
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Hiển thị ra giao diện (padSart để luôn có 2 chữ số)
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

    // Xử lý khi đếm ngược kết thúc
    if (distance < 0) {
      clearInterval(timer);
      document.getElementById('days').innerText = '00';
      document.getElementById('hours').innerText = '00';
      document.getElementById('minutes').innerText = '00';
      document.getElementById('seconds').innerText = '00';

      // Bạn có thể thêm hành động tùy ý ở đây
      console.log('Ưu đãi đã hết hạn!');
      // Ví dụ: Ẩn phần countdown hoặc đổi chữ thành "Đã hết ưu đãi"
    }
  }, 1000);
}

// Gọi hàm khi trang web tải xong
document.addEventListener('DOMContentLoaded', startCountdown);

// Khi nhận được kết quả từ API
if (result.success) {
  const botMsgDiv = document.createElement('div');
  botMsgDiv.className = 'message bot';
  chatBody.appendChild(botMsgDiv);
  typeWriter(result.data, botMsgDiv); // Gọi hiệu ứng chạy chữ
}

document.addEventListener('DOMContentLoaded', () => {
  fetchClasses();
});

async function fetchClasses() {
  const tableBody = document.getElementById('class-table-body');

  try {
    const response = await fetch('/courses/class/all');
    const classes = await response.json();

    if (!classes || classes.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="7" style="text-align: center;">Hiện chưa có lớp học nào khả dụng.</td></tr>';
      return;
    }

    tableBody.innerHTML = ''; // Xóa dòng "Đang tải"

    classes.forEach((cls) => {
      const row = document.createElement('tr');

      // Tính toán giá sau ưu đãi (nếu cần show học phí)
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
