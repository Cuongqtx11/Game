let courseData = null;
let currentLevel = 'beginner';
let currentTopic = 'all';

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

async function loadData() {
  const res = await fetch('./data/content.json');
  courseData = await res.json();

  renderStats();
  renderLevelTabs();
  renderLevel();
  renderSidebarNavigation();
  qs('#submit-quiz').addEventListener('click', submitQuiz);
}

function renderStats() {
  qs('#stat-lessons').textContent = courseData.lessons.length;
  qs('#stat-vocab').textContent = courseData.vocabulary.length;
  qs('#stat-quiz').textContent = courseData.quiz.length;
}

function renderLevelTabs() {
  const wrap = qs('#level-tabs');
  wrap.innerHTML = courseData.levels.map(level => `
    <button class="tab ${level.id === currentLevel ? 'active' : ''}" data-level="${level.id}">${level.title}</button>
  `).join('');

  qsa('#level-tabs .tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLevel = btn.dataset.level;
      currentTopic = 'all';
      renderLevelTabs();
      renderLevel();
    });
  });
}

function renderLevel() {
  const level = courseData.levels.find(item => item.id === currentLevel);
  if (!level) return;

  qs('#level-title').textContent = level.title;
  qs('#level-description').textContent = level.description;
  qs('#level-bar').style.width = `${level.progress}%`;
  qs('#xp-bar').style.width = `${Math.min(level.progress + 10, 100)}%`;
  qs('#xp-text').textContent = `${level.xp} XP`;
  qs('#streak-tip').textContent = getStreakTip(level.id);
  qs('#daily-mission').textContent = getMission(level.id);

  renderLessons(level.id);
  renderTopics(level.topics);
  renderVocabulary(level.id);
  renderDialogues(level.id);
  renderGrammar(level.id);
  renderQuiz(level.id);
}

function getStreakTip(levelId) {
  const tips = {
    beginner: 'Mỗi ngày học Hangul + 5 từ chào hỏi + 1 câu giới thiệu bản thân.',
    elementary: 'Ôn 2 mẫu ngữ pháp cơ bản và tập đặt câu theo tình huống ăn uống, mua sắm.',
    intermediate: 'Luyện kể kế hoạch, cảm xúc và hội thoại ngắn theo ngữ cảnh công việc / du lịch.',
    advanced: 'Tập phản hồi lịch sự, đưa ý kiến và tóm tắt công việc bằng câu dài hơn.'
  };
  return tips[levelId] || '';
}

function getMission(levelId) {
  const mission = {
    beginner: 'Hoàn thành 1 bài Hangul, ôn 5 từ mới và trả lời 2 câu quiz nhập môn.',
    elementary: 'Học 1 bài giao tiếp cơ bản, 1 chủ đề từ vựng và hoàn thành quiz thực hành.',
    intermediate: 'Ôn hội thoại thực tế, ghi nhớ mẫu câu nguyên nhân / dự định và làm 2 câu khó.',
    advanced: 'Luyện email/công việc lịch sự, đọc hội thoại nâng cao và chinh phục quiz chuyên sâu.'
  };
  return mission[levelId] || '';
}

function renderLessons(levelId) {
  const lessons = courseData.lessons.filter(item => item.level === levelId);
  qs('#curriculum').innerHTML = lessons.map(item => `
    <div class="lesson-item">
      <div class="lesson-icon">${item.icon}</div>
      <div class="lesson-copy">
        <strong>${item.title}</strong>
        <span>${item.summary}</span>
        <div class="lesson-tags">
          ${item.tags.map(tag => `<span class="lesson-tag">${tag}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function renderTopics(topics) {
  const container = qs('#topic-chips');
  const allTopics = ['all', ...topics];
  container.innerHTML = allTopics.map(topic => `
    <button class="chip ${topic === currentTopic ? 'active' : ''}" data-topic="${topic}">${topicLabel(topic)}</button>
  `).join('');

  qsa('#topic-chips .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTopic = btn.dataset.topic;
      renderTopics(topics);
      renderVocabulary(currentLevel);
    });
  });
}

function topicLabel(topic) {
  const labels = {
    all: 'Tất cả',
    hangul: 'Hangul',
    greetings: 'Chào hỏi',
    'daily-life': 'Đời sống',
    school: 'Trường học',
    shopping: 'Mua sắm',
    food: 'Ăn uống',
    work: 'Công việc',
    travel: 'Du lịch',
    feelings: 'Cảm xúc',
    business: 'Business',
    social: 'Xã giao',
    opinions: 'Ý kiến'
  };
  return labels[topic] || topic;
}

function renderVocabulary(levelId) {
  let vocab = courseData.vocabulary.filter(item => item.level === levelId);
  if (currentTopic !== 'all') {
    vocab = vocab.filter(item => item.topic === currentTopic);
  }

  qs('#vocab-list').innerHTML = vocab.length ? vocab.map(item => `
    <div class="vocab-item">
      <div class="vocab-top">
        <h3>${item.korean}</h3>
        <span class="vocab-tag">${topicLabel(item.topic)}</span>
      </div>
      <div class="vocab-meta">
        <div><strong>Romanized:</strong> ${item.romanized}</div>
        <div><strong>Phiên âm Việt:</strong> ${item.vietnamesePronunciation}</div>
        <div><strong>Ngữ cảnh:</strong> ${item.context}</div>
      </div>
      <div class="vocab-meaning">Nghĩa: ${item.meaning}</div>
    </div>
  `).join('') : '<div class="empty-state">Chưa có từ vựng cho bộ lọc này.</div>';
}

function renderDialogues(levelId) {
  const dialogues = courseData.dialogues.filter(item => item.level === levelId);
  qs('#dialogue-list').innerHTML = dialogues.map(item => `
    <div class="dialogue-item">
      <strong>${item.title}</strong>
      ${item.lines.map(line => `
        <div class="dialogue-line">
          <div class="speaker">${line.speaker}</div>
          <div>
            <div class="line-korean">${line.korean}</div>
            <div class="line-vietnamese">${line.vietnamese}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function renderGrammar(levelId) {
  const grammar = courseData.grammar.filter(item => item.level === levelId);
  qs('#grammar-list').innerHTML = grammar.map(item => `
    <div class="grammar-item">
      <div class="grammar-pattern">${item.pattern}</div>
      <strong>${item.title}</strong>
      <p>${item.explanation}</p>
    </div>
  `).join('');
}

function renderQuiz(levelId) {
  const quiz = courseData.quiz.filter(item => item.level === levelId);
  qs('#quiz-form').innerHTML = quiz.map((q, index) => `
    <div class="quiz-question">
      <div class="quiz-question-head">
        <div class="question-number">${index + 1}</div>
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
  qs('#quiz-result').classList.add('hidden');
}

function submitQuiz() {
  const quiz = courseData.quiz.filter(item => item.level === currentLevel);
  let score = 0;
  const details = quiz.map((q) => {
    const checked = document.querySelector(`input[name="question-${q.id}"]:checked`);
    const userAnswer = checked ? checked.value : null;
    const correct = userAnswer === q.answer || userAnswer === q.answer;
    if (correct) score += 1;
    return { ...q, userAnswer, correct };
  });

  const percent = quiz.length ? Math.round((score / quiz.length) * 100) : 0;
  const rankText = percent >= 80 ? 'Xuất sắc' : percent >= 60 ? 'Khá tốt' : 'Cần luyện thêm';
  const html = details.map(item => `
    ${item.correct ? '✅' : '❌'} ${item.question}<br>
    <span class="muted">Đáp án đúng: <strong>${item.answer}</strong>${item.userAnswer ? ` • Bạn chọn: ${item.userAnswer}` : ' • Bạn chưa chọn'}</span>
  `).join('<br><br>');

  const resultBox = qs('#quiz-result');
  resultBox.classList.remove('hidden');
  resultBox.innerHTML = `
    <div><strong>Kết quả:</strong> ${score}/${quiz.length} câu đúng (${percent}%) - <strong>${rankText}</strong></div>
    <div><strong>XP nhận được:</strong> +${score * 15}</div>
    <div style="margin-top:10px;">${html}</div>
  `;

  const level = courseData.levels.find(item => item.id === currentLevel);
  if (level) {
    qs('#xp-text').textContent = `${level.xp + score * 15} XP`;
    qs('#xp-bar').style.width = `${Math.min(level.progress + score * 5, 100)}%`;
  }
}

function renderSidebarNavigation() {
  qsa('.menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.menu-item').forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.scroll;
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

loadData().catch(() => {
  document.body.innerHTML = '<div style="padding:24px;font-family:Be Vietnam Pro,Arial,sans-serif;">Không tải được dữ liệu khoá học. Hãy kiểm tra lại file <strong>data/content.json</strong>.</div>';
});