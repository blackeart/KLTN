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
