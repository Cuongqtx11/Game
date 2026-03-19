let courseData = null;
let currentLevel = 'beginner';
let currentTopic = 'all';
let selectedGoal = 'Giao tiếp hằng ngày';
const STORAGE_KEY = 'hanviet-quest-premium';

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

const state = {
  streak: 0,
  badges: 0,
  totalXp: 0,
  darkMode: false,
  onboardingDone: false,
  goal: selectedGoal
};

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    Object.assign(state, JSON.parse(raw));
    selectedGoal = state.goal || selectedGoal;
  } catch {}
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function loadData() {
  loadStoredState();
  applyTheme();
  const res = await fetch('./data/content.json');
  courseData = await res.json();

  renderStats();
  renderLevelTabs();
  renderLevel();
  renderSidebarNavigation();
  renderBottomNavigation();
  bindUI();
  updatePersistentUI();
  toggleOnboarding();
  qs('#submit-quiz').addEventListener('click', submitQuiz);
}

function bindUI() {
  qs('#open-learning-path').addEventListener('click', () => openLearningScreen('lessons'));
  qs('#open-vocab-screen').addEventListener('click', () => openLearningScreen('vocabulary'));
  qs('#open-dialogue-screen').addEventListener('click', () => openLearningScreen('dialogues'));
  qs('#open-quiz-screen').addEventListener('click', () => openLearningScreen('quiz'));
  qs('#screen-overlay').addEventListener('click', closeAllScreens);
  qsa('.close-screen').forEach(btn => btn.addEventListener('click', () => closeScreen(btn.dataset.close)));
  qs('#menu-toggle').addEventListener('click', toggleSidebar);
  qs('#theme-toggle').addEventListener('click', toggleTheme);
  qs('#theme-toggle-mobile').addEventListener('click', toggleTheme);
  qs('#mark-study-done').addEventListener('click', markStudyDone);
  qsa('.goal-btn').forEach(btn => btn.addEventListener('click', () => selectGoal(btn)));
  qs('#start-app').addEventListener('click', startApp);
}

function toggleOnboarding() {
  qs('#onboarding').classList.toggle('hidden', state.onboardingDone);
  document.body.classList.toggle('no-scroll', !state.onboardingDone);
  qsa('.goal-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.goal === state.goal));
}

function selectGoal(btn) {
  state.goal = btn.dataset.goal;
  qsa('.goal-btn').forEach(item => item.classList.remove('active'));
  btn.classList.add('active');
}

function startApp() {
  state.onboardingDone = true;
  saveState();
  toggleOnboarding();
  updatePersistentUI();
}

function toggleTheme() {
  state.darkMode = !state.darkMode;
  saveState();
  applyTheme();
}

function applyTheme() {
  document.body.classList.toggle('dark', !!state.darkMode);
}

function markStudyDone() {
  state.streak += 1;
  if (state.streak % 3 === 0) state.badges += 1;
  saveState();
  updatePersistentUI();
}

function updatePersistentUI() {
  qs('#streak-count').textContent = state.streak;
  qs('#streak-big').textContent = `${state.streak} ngày`;
  qs('#badge-count').textContent = state.badges;
  qs('#goal-display').textContent = state.goal || selectedGoal;
}

function toggleSidebar() {
  qs('#sidebar').classList.toggle('open');
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
  qs('#xp-text').textContent = `${level.xp + state.totalXp} XP`;
  qs('#streak-tip').textContent = getStreakTip(level.id);

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

function renderLessons(levelId) {
  const lessons = courseData.lessons.filter(item => item.level === levelId);
  qs('#curriculum').innerHTML = lessons.map(item => `
    <div class="lesson-item">
      <div class="lesson-icon">${item.icon}</div>
      <div class="lesson-copy">
        <strong>${item.title}</strong>
        <span>${item.summary}</span>
        <div class="lesson-tags">${item.tags.map(tag => `<span class="lesson-tag">${tag}</span>`).join('')}</div>
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
  const labels = { all: 'Tất cả', hangul: 'Hangul', greetings: 'Chào hỏi', 'daily-life': 'Đời sống', school: 'Trường học', shopping: 'Mua sắm', food: 'Ăn uống', work: 'Công việc', travel: 'Du lịch', feelings: 'Cảm xúc', business: 'Business', social: 'Xã giao', opinions: 'Ý kiến' };
  return labels[topic] || topic;
}

function renderVocabulary(levelId) {
  let vocab = courseData.vocabulary.filter(item => item.level === levelId);
  if (currentTopic !== 'all') vocab = vocab.filter(item => item.topic === currentTopic);

  qs('#vocab-list').innerHTML = vocab.length ? vocab.map((item, index) => `
    <div class="vocab-item" data-vocab-index="${index}">
      <div class="vocab-card-inner">
        <div class="vocab-face front">
          <div class="vocab-top"><h3>${item.korean}</h3><span class="vocab-tag">${topicLabel(item.topic)}</span></div>
          <div class="vocab-meta"><div><strong>Romanized:</strong> ${item.romanized}</div><div><strong>Phiên âm Việt:</strong> ${item.vietnamesePronunciation}</div></div>
          <div class="vocab-meaning">Tap để lật thẻ</div>
        </div>
        <div class="vocab-face back">
          <div class="vocab-top"><h3>${item.meaning}</h3><span class="vocab-tag">${topicLabel(item.topic)}</span></div>
          <div class="vocab-meta"><div><strong>Ngữ cảnh:</strong> ${item.context}</div><div><strong>Từ gốc:</strong> ${item.korean}</div></div>
          <div class="vocab-meaning">Tap để xem lại</div>
        </div>
      </div>
    </div>
  `).join('') : '<div class="empty-state">Chưa có từ vựng cho bộ lọc này.</div>';

  qsa('.vocab-item').forEach((card, index) => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
      if (card.classList.contains('flipped')) setTimeout(() => openVocabModal(vocab[index]), 250);
    });
  });
}

function renderDialogues(levelId) {
  const dialogues = courseData.dialogues.filter(item => item.level === levelId);
  qs('#dialogue-list').innerHTML = dialogues.map(item => `
    <div class="dialogue-item">
      <strong>${item.title}</strong>
      ${item.lines.map(line => `<div class="dialogue-line"><div class="speaker">${line.speaker}</div><div><div class="line-korean">${line.korean}</div><div class="line-vietnamese">${line.vietnamese}</div></div></div>`).join('')}
    </div>
  `).join('');
}

function renderGrammar(levelId) {
  const grammar = courseData.grammar.filter(item => item.level === levelId);
  qs('#grammar-list').innerHTML = grammar.map(item => `
    <div class="grammar-item"><div class="grammar-pattern">${item.pattern}</div><strong>${item.title}</strong><p>${item.explanation}</p></div>
  `).join('');
}

function renderQuiz(levelId) {
  const quiz = courseData.quiz.filter(item => item.level === levelId);
  qs('#quiz-form').innerHTML = quiz.map((q, index) => `
    <div class="quiz-question"><div class="quiz-question-head"><div class="question-number">${index + 1}</div><strong>${q.question}</strong></div><div class="quiz-options">${q.options.map(opt => `<label class="quiz-option"><input type="radio" name="question-${q.id}" value="${opt}"><span>${opt}</span></label>`).join('')}</div></div>
  `).join('');
  qs('#quiz-result').classList.add('hidden');
}

function submitQuiz() {
  const quiz = courseData.quiz.filter(item => item.level === currentLevel);
  let score = 0;
  const details = quiz.map((q) => {
    const checked = document.querySelector(`input[name="question-${q.id}"]:checked`);
    const userAnswer = checked ? checked.value : null;
    const correct = userAnswer === q.answer;
    if (correct) score += 1;
    return { ...q, userAnswer, correct };
  });

  const gainedXp = score * 15;
  state.totalXp += gainedXp;
  if (score === quiz.length && quiz.length > 0) state.badges += 1;
  saveState();
  updatePersistentUI();

  const percent = quiz.length ? Math.round((score / quiz.length) * 100) : 0;
  const rankText = percent >= 80 ? 'Xuất sắc' : percent >= 60 ? 'Khá tốt' : 'Cần luyện thêm';
  const html = details.map(item => `${item.correct ? '✅' : '❌'} ${item.question}<br><span class="muted">Đáp án đúng: <strong>${item.answer}</strong>${item.userAnswer ? ` • Bạn chọn: ${item.userAnswer}` : ' • Bạn chưa chọn'}</span>`).join('<br><br>');

  const resultBox = qs('#quiz-result');
  resultBox.classList.remove('hidden');
  resultBox.innerHTML = `<div><strong>Kết quả:</strong> ${score}/${quiz.length} câu đúng (${percent}%) - <strong>${rankText}</strong></div><div><strong>XP nhận được:</strong> +${gainedXp}</div><div style="margin-top:10px;">${html}</div>`;
  renderLevel();
}

function renderSidebarNavigation() {
  qsa('.menu-item').forEach(btn => bindScrollButton(btn, '.menu-item'));
}

function renderBottomNavigation() {
  qsa('.bottom-nav-item').forEach(btn => bindScrollButton(btn, '.bottom-nav-item'));
}

function bindScrollButton(btn, groupSelector) {
  btn.addEventListener('click', () => {
    qsa(groupSelector).forEach(item => item.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.scroll;
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    qs('#sidebar').classList.remove('open');
  });
}

function openLearningScreen(type) {
  const content = qs('#screen-content');
  const level = courseData.levels.find(item => item.id === currentLevel);
  const lessons = courseData.lessons.filter(item => item.level === currentLevel);
  const vocab = courseData.vocabulary.filter(item => item.level === currentLevel).slice(0, 6);
  const dialogues = courseData.dialogues.filter(item => item.level === currentLevel);
  const quiz = courseData.quiz.filter(item => item.level === currentLevel);

  if (type === 'lessons') {
    qs('#screen-title').textContent = `${level.title} • Màn học`;
    content.innerHTML = lessons.map(item => `<div class="screen-lesson"><strong>${item.icon} ${item.title}</strong><p>${item.summary}</p><div class="lesson-tags">${item.tags.map(tag => `<span class="lesson-tag">${tag}</span>`).join('')}</div></div>`).join('');
  }
  if (type === 'vocabulary') {
    qs('#screen-title').textContent = `${level.title} • Flashcards`;
    content.innerHTML = vocab.map(item => `<div class="screen-lesson"><div class="vocab-big-word">${item.korean}</div><p><strong>Nghĩa:</strong> ${item.meaning}</p><p><strong>Phiên âm:</strong> ${item.romanized}</p><p><strong>Ngữ cảnh:</strong> ${item.context}</p></div>`).join('');
  }
  if (type === 'dialogues') {
    qs('#screen-title').textContent = `${level.title} • Màn hội thoại`;
    content.innerHTML = dialogues.map(item => `<div class="screen-lesson"><strong>${item.title}</strong>${item.lines.map(line => `<div class="dialogue-line"><div class="speaker">${line.speaker}</div><div><div class="line-korean">${line.korean}</div><div class="line-vietnamese">${line.vietnamese}</div></div></div>`).join('')}</div>`).join('');
  }
  if (type === 'quiz') {
    qs('#screen-title').textContent = `${level.title} • Màn luyện quiz`;
    content.innerHTML = quiz.map((item, index) => `<div class="screen-lesson"><strong>Câu ${index + 1}</strong><p>${item.question}</p><div class="lesson-tags">${item.options.map(opt => `<span class="lesson-tag">${opt}</span>`).join('')}</div></div>`).join('');
  }

  openScreen('learning-screen');
}

function openVocabModal(item) {
  qs('#vocab-modal-title').textContent = item.korean;
  qs('#vocab-modal-content').innerHTML = `<div class="vocab-big-word">${item.korean}</div><p><strong>Nghĩa tiếng Việt:</strong> ${item.meaning}</p><p><strong>Romanized:</strong> ${item.romanized}</p><p><strong>Phiên âm Việt:</strong> ${item.vietnamesePronunciation}</p><p><strong>Chủ đề:</strong> ${topicLabel(item.topic)}</p><p><strong>Ngữ cảnh sử dụng:</strong> ${item.context}</p>`;
  openScreen('vocab-modal');
}

function openScreen(id) {
  qs('#screen-overlay').classList.remove('hidden');
  qs(`#${id}`).classList.remove('hidden');
  document.body.classList.add('no-scroll');
}

function closeScreen(id) {
  qs(`#${id}`).classList.add('hidden');
  if (!qsa('.app-screen:not(.hidden), .app-modal:not(.hidden)').length) {
    qs('#screen-overlay').classList.add('hidden');
    if (state.onboardingDone) document.body.classList.remove('no-scroll');
  }
}

function closeAllScreens() {
  qsa('.app-screen, .app-modal').forEach(el => el.classList.add('hidden'));
  qs('#screen-overlay').classList.add('hidden');
  if (state.onboardingDone) document.body.classList.remove('no-scroll');
}

loadData().catch(() => {
  document.body.innerHTML = '<div style="padding:24px;font-family:Be Vietnam Pro,Arial,sans-serif;">Không tải được dữ liệu khoá học. Hãy kiểm tra lại file <strong>data/content.json</strong>.</div>';
});