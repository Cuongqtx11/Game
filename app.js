const STORAGE_KEY = 'hanviet-quest-premium';
const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];

const state = {
  streak: 0,
  badges: 0,
  totalXp: 0,
  darkMode: false,
  onboardingDone: false,
  goal: 'Giao tiếp hằng ngày'
};

let content = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch {}
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyTheme() {
  document.body.classList.toggle('dark', state.darkMode);
}

function updateProfileUI() {
  qs('#streak-count').textContent = state.streak;
  qs('#badge-count').textContent = state.badges;
  qs('#goal-display').textContent = state.goal;
  qs('#profile-goal').textContent = state.goal;
  qs('#profile-xp').textContent = `${state.totalXp} XP`;
  qs('#profile-streak').textContent = `${state.streak} ngày`;
  qs('#profile-badges').textContent = `${state.badges} badge`;
}

function renderAppInfo() {
  qs('#app-title').textContent = content.app.title;
  qs('#app-subtitle').textContent = content.app.subtitle;
  qs('#today-title').textContent = content.dailyLesson.title;
  qs('#today-focus').textContent = content.dailyLesson.focus;
  qs('#today-tasks').innerHTML = content.dailyLesson.tasks.map(t => `<li>${t}</li>`).join('');

  const unitCount = content.chapters.reduce((n, group) => n + group.items.length, 0);
  qs('#stat-levels').textContent = content.levels.length;
  qs('#stat-chapters').textContent = unitCount;
  qs('#stat-vocab').textContent = content.vocabulary.length;
  qs('#stat-tests').textContent = content.tests.length;
  qs('#xp-text').textContent = `${content.levels[0].xp + state.totalXp} XP`;
  qs('#xp-bar').style.width = `${Math.min(18 + state.totalXp / 10, 100)}%`;
}

function renderSidebarMenu() {
  const menu = qs('#sidebar-menu');
  menu.innerHTML = content.learnMenu.map((item, index) => `
    <button class="menu-item ${index === 0 ? 'active' : ''}" data-scroll="${item.id === 'today' ? 'today' : item.id}">${item.icon} ${item.title}</button>
  `).join('');

  qsa('.menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.menu-item').forEach(i => i.classList.remove('active'));
      btn.classList.add('active');
      const el = document.getElementById(btn.dataset.scroll);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      qs('#sidebar').classList.remove('open');
    });
  });
}

function renderBottomNav() {
  qsa('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.bottom-nav-item').forEach(i => i.classList.remove('active'));
      btn.classList.add('active');
      const el = document.getElementById(btn.dataset.scroll);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderChapters() {
  qs('#chapter-groups').innerHTML = content.chapters.map(group => `
    <div class="chapter-group">
      <div class="section-title-row compact"><div><h3>${group.group}</h3></div></div>
      <div class="chapter-items">
        ${group.items.map(item => `
          <article class="chapter-card card">
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            <div class="lesson-tags">${item.tags.map(tag => `<span class="lesson-tag">${tag}</span>`).join('')}</div>
          </article>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderQuick7() {
  qs('#quick7-grid').innerHTML = content.quick7Days.map(item => `
    <article class="feature-card card">
      <h3>${item.day} - ${item.title}</h3>
      <p>${item.focus}</p>
    </article>
  `).join('');
}

function renderSpeak30() {
  qs('#speak30-grid').innerHTML = content.speak30Days.map(item => `
    <article class="feature-card card">
      <h3>Day ${item.day}: ${item.title}</h3>
      <p><strong>Từ khóa:</strong> ${item.keywords.join(', ')}</p>
      <p><strong>Mẫu câu:</strong> ${item.phrase}</p>
    </article>
  `).join('');
}

function renderTopics() {
  qs('#topic-groups').innerHTML = content.topics.map(topic => `
    <article class="topic-card card">
      <h3>${topic.title}</h3>
      <p>${topic.words.join(' • ')}</p>
    </article>
  `).join('');

  qs('#topic-field-grid').innerHTML = content.topics.map(topic => `
    <article class="feature-card card">
      <h3>${topic.title}</h3>
      <p>${topic.words.join(', ')}</p>
    </article>
  `).join('');
}

function renderVocabulary() {
  qs('#vocab-list').innerHTML = content.vocabulary.map((item, index) => `
    <div class="vocab-item" data-index="${index}">
      <div class="vocab-card-inner">
        <div class="vocab-face front">
          <div class="vocab-top"><h3>${item.korean}</h3><span class="vocab-tag">${item.topic}</span></div>
          <div class="vocab-meta">
            <div><strong>Romanized:</strong> ${item.romanized}</div>
            <div><strong>Phiên âm Việt:</strong> ${item.vietnamesePronunciation}</div>
          </div>
          <div class="vocab-meaning">Chạm để xem nghĩa</div>
        </div>
        <div class="vocab-face back">
          <div class="vocab-top"><h3>${item.meaning}</h3><span class="vocab-tag">${item.level}</span></div>
          <div class="vocab-meta"><div><strong>Ngữ cảnh:</strong> ${item.context}</div></div>
          <div class="vocab-meaning">Lật lại để tiếp tục</div>
        </div>
      </div>
    </div>
  `).join('');

  qsa('.vocab-item').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
  });
}

function renderGrammar() {
  const blocks = [
    { title: 'Ngữ pháp cơ bản', items: content.grammar.basic },
    { title: 'Ngữ pháp trung cấp', items: content.grammar.intermediate },
    { title: 'Ngữ pháp nâng cao', items: content.grammar.advanced }
  ];

  qs('#grammar-sections').innerHTML = blocks.map(block => `
    <article class="grammar-card-item card">
      <h3>${block.title}</h3>
      ${block.items.map(item => `
        <div class="lesson-tags" style="margin-top:14px;"></div>
        <div class="grammar-pattern">${item.pattern}</div>
        <p><strong>${item.title}</strong></p>
        <p>${item.example}</p>
      `).join('')}
    </article>
  `).join('');
}

function renderDialogues() {
  qs('#dialogue-list').innerHTML = content.dialogues.map(dialogue => `
    <article class="dialogue-card card">
      <h3>${dialogue.title}</h3>
      ${dialogue.lines.map(line => `
        <div class="dialogue-line">
          <div class="speaker">${line.speaker}</div>
          <div>
            <div class="line-korean">${line.korean}</div>
            <div class="line-vietnamese">${line.vietnamese}</div>
          </div>
        </div>
      `).join('')}
    </article>
  `).join('');
}

function renderTopik() {
  qs('#topik-grid').innerHTML = `
    <article class="feature-card card">
      <h3>TOPIK I</h3>
      <p>${content.topik.topik1.join(' • ')}</p>
    </article>
    <article class="feature-card card">
      <h3>TOPIK II</h3>
      <p>${content.topik.topik2.join(' • ')}</p>
    </article>
    <article class="feature-card card">
      <h3>Chiến thuật làm bài</h3>
      <p>${content.topik.strategies.join(' • ')}</p>
    </article>
  `;
}

function renderTests() {
  qs('#test-cards').innerHTML = content.tests.map(test => `
    <article class="test-card card">
      <h3>${test.title}</h3>
      <p>${test.summary}</p>
    </article>
  `).join('');

  qs('#quiz-form').innerHTML = content.quiz.map((q, idx) => `
    <div class="quiz-question">
      <div class="quiz-question-head"><div class="question-number">${idx + 1}</div><strong>${q.question}</strong></div>
      <div class="quiz-options">
        ${q.options.map(opt => `
          <label class="quiz-option"><input type="radio" name="question-${q.id}" value="${opt}"><span>${opt}</span></label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function submitQuiz() {
  let score = 0;
  const results = content.quiz.map(q => {
    const checked = document.querySelector(`input[name="question-${q.id}"]:checked`);
    const userAnswer = checked ? checked.value : null;
    const correct = userAnswer === q.answer;
    if (correct) score++;
    return { ...q, correct, userAnswer };
  });

  const gainedXp = score * 20;
  state.totalXp += gainedXp;
  if (score >= Math.ceil(content.quiz.length * 0.8)) state.badges += 1;
  saveState();
  updateProfileUI();
  renderAppInfo();

  const resultHtml = results.map(r => `${r.correct ? '✅' : '❌'} ${r.question}<br><span class="muted">Đáp án đúng: <strong>${r.answer}</strong>${r.userAnswer ? ` • Bạn chọn: ${r.userAnswer}` : ' • Bạn chưa chọn'}</span>`).join('<br><br>');
  const box = qs('#quiz-result');
  box.classList.remove('hidden');
  box.innerHTML = `<strong>Kết quả:</strong> ${score}/${content.quiz.length} câu đúng • +${gainedXp} XP<br><br>${resultHtml}`;
}

function bindUI() {
  qs('#submit-quiz').addEventListener('click', submitQuiz);
  qs('#menu-toggle').addEventListener('click', () => qs('#sidebar').classList.toggle('open'));
  qs('#theme-toggle').addEventListener('click', toggleTheme);
  qs('#theme-toggle-mobile').addEventListener('click', toggleTheme);
  qs('#mark-study-done').addEventListener('click', markStudyDone);
  qs('#open-learning-path').addEventListener('click', openLearningScreen);
  qsa('.goal-btn').forEach(btn => btn.addEventListener('click', () => selectGoal(btn)));
  qs('#start-app').addEventListener('click', startApp);
  qsa('.close-screen').forEach(btn => btn.addEventListener('click', closeLearningScreen));
  qs('#screen-overlay').addEventListener('click', closeLearningScreen);
}

function toggleTheme() {
  state.darkMode = !state.darkMode;
  saveState();
  applyTheme();
}

function markStudyDone() {
  state.streak += 1;
  if (state.streak % 3 === 0) state.badges += 1;
  saveState();
  updateProfileUI();
}

function selectGoal(btn) {
  qsa('.goal-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.goal = btn.dataset.goal;
}

function startApp() {
  state.onboardingDone = true;
  saveState();
  qs('#onboarding').classList.add('hidden');
  document.body.classList.remove('no-scroll');
  updateProfileUI();
}

function openLearningScreen() {
  qs('#screen-title').textContent = 'Lộ trình học nhanh';
  qs('#screen-content').innerHTML = content.chapters.map(group => `
    <div class="screen-lesson">
      <h3>${group.group}</h3>
      <p>${group.items.map(i => i.title).join(' • ')}</p>
    </div>
  `).join('');
  qs('#screen-overlay').classList.remove('hidden');
  qs('#learning-screen').classList.remove('hidden');
  document.body.classList.add('no-scroll');
}

function closeLearningScreen() {
  qs('#screen-overlay').classList.add('hidden');
  qs('#learning-screen').classList.add('hidden');
  if (state.onboardingDone) document.body.classList.remove('no-scroll');
}

function initOnboarding() {
  if (!state.onboardingDone) {
    qs('#onboarding').classList.remove('hidden');
    document.body.classList.add('no-scroll');
  }
  qsa('.goal-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.goal === state.goal));
}

async function init() {
  loadState();
  applyTheme();
  const res = await fetch('./data/content.json');
  content = await res.json();
  renderAppInfo();
  renderSidebarMenu();
  renderBottomNav();
  renderChapters();
  renderQuick7();
  renderSpeak30();
  renderTopics();
  renderVocabulary();
  renderGrammar();
  renderDialogues();
  renderTopik();
  renderTests();
  updateProfileUI();
  bindUI();
  initOnboarding();
}

init().catch(() => {
  document.body.innerHTML = '<div style="padding:24px;font-family:Arial,sans-serif;">Không tải được dữ liệu khóa học.</div>';
});