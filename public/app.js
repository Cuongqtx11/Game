const curriculumMap = {
  beginner: {
    title: 'Người Mới Bắt Đầu',
    description: 'Dành cho người mới bắt đầu: làm quen bảng chữ cái Hangul, từ vựng cơ bản và các mẫu câu chào hỏi hằng ngày.',
    progress: 35,
    xp: 120,
    items: [
      { icon: '🔤', title: 'Bảng chữ cái Hangul', subtitle: 'Nhận diện và phát âm chuẩn từng ký tự' },
      { icon: '🧠', title: 'Từ vựng cơ bản', subtitle: 'Nhóm từ dùng hằng ngày cho người mới học' },
      { icon: '💬', title: 'Mẫu câu chào hỏi', subtitle: 'Phản xạ với các câu giao tiếp nhập môn' },
      { icon: '🎧', title: 'Tập đọc phiên âm', subtitle: 'Ghép âm và đọc tự nhiên hơn' }
    ]
  },
  advanced: {
    title: 'Người Cũ',
    description: 'Dành cho người đã có nền tảng: học ngữ pháp nâng cao, phản xạ giao tiếp và mở rộng vốn từ thực tế.',
    progress: 72,
    xp: 260,
    items: [
      { icon: '📘', title: 'Ngữ pháp nâng cao', subtitle: 'Mẫu câu dài và cách dùng theo ngữ cảnh' },
      { icon: '🗣️', title: 'Giao tiếp đời sống', subtitle: 'Đối thoại tự nhiên khi gặp người Hàn' },
      { icon: '🧩', title: 'Từ vựng theo tình huống', subtitle: 'Đi làm, đi ăn, đi mua sắm, du lịch' },
      { icon: '⚡', title: 'Luyện phản xạ hội thoại', subtitle: 'Học theo kiểu chơi nhanh - nhớ lâu' }
    ]
  }
};

let currentLevel = 'beginner';
let allVocab = [];
let quizQuestions = [];

function updateProgressUI(progress, xp) {
  document.getElementById('level-bar').style.width = `${progress}%`;
  document.getElementById('xp-bar').style.width = `${Math.min(progress + 10, 100)}%`;
  document.getElementById('xp-text').textContent = `${xp} XP`;
}

async function loadVocab() {
  const res = await fetch('/api/vocab');
  allVocab = await res.json();
  renderLevel();
}

async function loadQuiz() {
  const res = await fetch('/api/quiz');
  quizQuestions = await res.json();
  renderQuiz();
}

function renderQuiz() {
  const form = document.getElementById('quiz-form');
  form.innerHTML = quizQuestions.map((q) => `
    <div class="quiz-question">
      <div class="quiz-question-head">
        <div class="question-number">${q.id}</div>
        <strong>${q.question}</strong>
      </div>
      <div class="quiz-options">
        ${q.options.map(opt => `
          <label class="quiz-option">
            <input type="radio" name="question-${q.id}" value="${opt}">
            <span>${opt}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderLevel() {
  const meta = curriculumMap[currentLevel];
  document.getElementById('level-title').textContent = meta.title;
  document.getElementById('level-description').textContent = meta.description;
  updateProgressUI(meta.progress, meta.xp);

  document.getElementById('curriculum').innerHTML = meta.items.map(item => `
    <div class="lesson-item">
      <div class="lesson-icon">${item.icon}</div>
      <div class="lesson-copy">
        <strong>${item.title}</strong>
        <span>${item.subtitle}</span>
      </div>
    </div>
  `).join('');

  const filtered = allVocab.filter(item => item.level === currentLevel);
  document.getElementById('vocab-list').innerHTML = filtered.map(item => `
    <div class="vocab-item">
      <div class="vocab-top">
        <h3>${item.korean}</h3>
        <span class="vocab-tag">${currentLevel === 'beginner' ? 'Starter' : 'Master'}</span>
      </div>
      <div class="vocab-meta">
        <div><strong>Romanized:</strong> ${item.romanized}</div>
        <div><strong>Phiên âm Việt:</strong> ${item.vietnamesePronunciation}</div>
      </div>
      <div class="vocab-meaning">Nghĩa: ${item.meaning}</div>
    </div>
  `).join('');
}

async function submitQuiz() {
  const answers = {};
  quizQuestions.forEach((q) => {
    const checked = document.querySelector(`input[name="question-${q.id}"]:checked`);
    if (checked) answers[q.id] = checked.value;
  });

  const res = await fetch('/api/submit-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers })
  });

  const data = await res.json();
  const scorePercent = Math.round((data.score / data.total) * 100);
  const rankText = scorePercent >= 80 ? 'Xuất sắc' : scorePercent >= 60 ? 'Khá tốt' : 'Cần luyện thêm';

  const details = data.results
    .map(r => `${r.correct ? '✅' : '❌'} Câu ${r.id}: đáp án đúng là <strong>${r.correctAnswer}</strong>`)
    .join('<br>');

  const resultBox = document.getElementById('quiz-result');
  resultBox.classList.remove('hidden');
  resultBox.innerHTML = `
    <div><strong>Kết quả:</strong> ${data.score}/${data.total} câu đúng (${scorePercent}%) - <strong>${rankText}</strong></div>
    <div><strong>XP nhận được:</strong> +${data.score * 15}</div>
    <div style="margin-top:10px;">${details}</div>
  `;

  updateProgressUI(Math.min(curriculumMap[currentLevel].progress + data.score * 3, 100), curriculumMap[currentLevel].xp + data.score * 15);
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = btn.dataset.level;
    document.getElementById('quiz-result').classList.add('hidden');
    renderLevel();
  });
});

document.getElementById('submit-quiz').addEventListener('click', submitQuiz);

loadVocab();
loadQuiz();