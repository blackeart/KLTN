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
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text); // Hiển thị tin nhắn người dùng
  chatInput.value = '';

  // Hiển thị trạng thái "đang trả lời..."
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message bot';
  loadingDiv.innerText = 'AI đang suy nghĩ...';
  chatBody.appendChild(loadingDiv);

  try {
    const response = await fetch('/chat/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    const result = await response.json();
    chatBody.removeChild(loadingDiv); // Xóa dòng đang chờ

    if (result.success) {
      appendMessage('bot', result.data);
    } else {
      appendMessage('bot', 'Có lỗi xảy ra, bạn thử lại nhé!');
    }
  } catch (error) {
    console.error(error);
    chatBody.removeChild(loadingDiv);
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

// Khi nhận được kết quả từ API
if (result.success) {
  const botMsgDiv = document.createElement('div');
  botMsgDiv.className = 'message bot';
  chatBody.appendChild(botMsgDiv);
  typeWriter(result.data, botMsgDiv); // Gọi hiệu ứng chạy chữ
}
