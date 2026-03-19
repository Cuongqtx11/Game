const STORAGE_KEY = 'hanviet-quest-premium';
const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];

const state = {
  streak: 0,
  badges: 0,
  totalXp: 0,
  darkMode: false,
  onboardingDone: false,
  goal: 'Giao tiếp hằng ngày',
  screen: 'home',
  savedWords: [],
  quizHistory: [],
  unitProgress: {}
};

let content = null;
let currentWordFilter = 'all';

function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) Object.assign(state, JSON.parse(raw)); } catch {} }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function applyTheme() { document.body.classList.toggle('dark', state.darkMode); }
function dayIndex(mod) { const now=new Date(); const start=new Date(now.getFullYear(),0,1); return Math.floor((now-start)/86400000)%mod; }
function getDailyWords(count=5) { const start = dayIndex(content.vocabulary.length); return Array.from({length:count}, (_,i)=>content.vocabulary[(start+i)%content.vocabulary.length]); }
function getDailyQuizSet(count=10) { const start = dayIndex(content.quiz.length); return Array.from({length:Math.min(count,content.quiz.length)}, (_,i)=>content.quiz[(start+i)%content.quiz.length]); }

function switchScreen(screen) {
  state.screen = screen; saveState();
  qsa('.app-view').forEach(view => view.classList.add('hidden'));
  qs(`#screen-${screen}`)?.classList.remove('hidden');
  qsa('.app-tab').forEach(tab => tab.classList.remove('active'));
  qsa(`.app-tab[data-screen="${screen}"]`).forEach(tab => tab.classList.add('active'));
  renderSubmenu(screen);
  qs('#sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderSubmenu(screen) {
  const map = {
    home: ['Bài học hôm nay', 'Daily Lesson', 'Quick Review', '7-Day Sprint', '30-Day Speaking'],
    learn: ['Lộ trình học', 'Unit / Lesson / Quiz', 'Học nhanh 7 ngày', 'Giao tiếp 30 ngày', 'Continue Learning'],
    words: ['Từ mới theo lĩnh vực', 'Flashcards', 'Từ đã lưu', 'Ôn từ theo ngày'],
    practice: ['Quiz theo cấp độ', 'Ngữ pháp', 'Hội thoại', 'TOPIK', 'Mock test', 'Lịch sử quiz'],
    profile: ['Mục tiêu học', 'XP', 'Streak', 'Badge', 'Tiến độ unit']
  };
  qs('#sidebar-submenu').innerHTML = (map[screen] || []).map(item => `<div class="submenu-item">${item}</div>`).join('');
}

function updateProfileUI() {
  qs('#streak-count').textContent = state.streak;
  qs('#badge-count').textContent = state.badges;
  qs('#goal-display').textContent = state.goal;
  qs('#profile-goal').textContent = state.goal;
  qs('#profile-xp').textContent = `${state.totalXp} XP`;
  qs('#profile-streak').textContent = `${state.streak} ngày`;
  qs('#profile-badges').textContent = `${state.badges} badge`;
  renderProfileExtras();
}

function renderProfileExtras() {
  const allUnits = content.chapters.flatMap(g => g.items);
  qs('#unit-progress-box').innerHTML = `<ul class="mini-list">${allUnits.map(u => `<li>${u.title}: ${state.unitProgress[u.id] || 0}%</li>`).join('')}</ul>`;
  qs('#quiz-history-box').innerHTML = state.quizHistory.length ? `<ul class="mini-list">${state.quizHistory.slice(-10).reverse().map(h => `<li>${h.date}: ${h.score}/${h.total}</li>`).join('')}</ul>` : 'Chưa có lịch sử quiz.';
}

function renderAppInfo() {
  const unitCount = content.chapters.reduce((n, group) => n + group.items.length, 0);
  const daily7 = content.quick7Days[dayIndex(content.quick7Days.length)];
  qs('#app-title').textContent = content.app.title;
  qs('#app-subtitle').textContent = `${content.app.subtitle} • ${content.meta.vocabCount} từ • ${content.meta.quizCount} bài luyện`;
  qs('#today-title').textContent = `${content.dailyLesson.title} • ${daily7.day}`;
  qs('#today-focus').textContent = `${content.dailyLesson.focus} | Gợi ý hôm nay: ${daily7.title}`;
  qs('#today-tasks').innerHTML = [...content.dailyLesson.tasks, `Từ mới hôm nay: ${getDailyWords(5).map(w => w.korean).join(', ')}`].map(t => `<li>${t}</li>`).join('');
  qs('#stat-levels').textContent = content.levels.length;
  qs('#stat-chapters').textContent = unitCount;
  qs('#stat-vocab').textContent = content.vocabulary.length;
  qs('#stat-tests').textContent = content.quiz.length;
  qs('#xp-text').textContent = `${content.levels[0].xp + state.totalXp} XP`;
  qs('#xp-bar').style.width = `${Math.min(18 + state.totalXp / 10, 100)}%`;
  renderDailyMissionBox(); renderContinueLearning(); renderDailyWordsBox(); renderSavedWordsBox();
}

function renderDailyMissionBox() { qs('#daily-missions').innerHTML = `<ul class="mini-list">${content.dailyMissions.map(m => `<li>${m}</li>`).join('')}</ul>`; }
function renderContinueLearning() { const blocks = content.chapters.slice(0,2).flatMap(g => g.items.slice(0,2)); qs('#continue-learning').innerHTML = `<ul class="mini-list">${blocks.map(i => `<li>${i.title} • ${i.lessons[0]}</li>`).join('')}</ul>`; }
function renderDailyWordsBox() { qs('#daily-words-box').innerHTML = `<ul class="mini-list">${getDailyWords(8).map(w => `<li>${w.korean} — ${w.meaning}</li>`).join('')}</ul>`; }
function renderSavedWordsBox() { const saved = content.vocabulary.filter(v => state.savedWords.includes(v.korean)); qs('#saved-words-box').innerHTML = saved.length ? `<ul class="mini-list">${saved.slice(0,12).map(w => `<li>${w.korean} — ${w.meaning}</li>`).join('')}</ul>` : 'Chưa có từ nào được lưu.'; }

function renderLearnModules() {
  const modules = content.learnMenu.filter(item => ['today','roadmap','quick7','speak30','topik','tests'].includes(item.id));
  qs('#learn-modules').innerHTML = modules.map(item => `<article class="feature-card card"><h3>${item.icon} ${item.title}</h3><p>${item.summary}</p></article>`).join('');
}

function openLessonDetail(unitId) {
  const unit = content.chapters.flatMap(g => g.items).find(i => i.id === unitId);
  if (!unit) return;
  qs('#screen-title').textContent = unit.title;
  qs('#screen-content').innerHTML = `
    <div class="screen-lesson">
      <p><strong>Tổng quan:</strong> ${unit.summary}</p>
      <p><strong>Thời lượng gợi ý:</strong> ${unit.estimatedMinutes} phút</p>
      <p><strong>Độ khó:</strong> ${unit.difficulty}</p>
      <div class="lesson-tags">${unit.tags.map(t => `<span class="lesson-tag">${t}</span>`).join('')}</div>
    </div>
    ${unit.lessonsDetailed.map((lesson, idx) => `
      <div class="screen-lesson">
        <h3>${idx + 1}. ${lesson.title}</h3>
        <p>${lesson.summary}</p>
        <p><strong>Từ trọng tâm:</strong> ${lesson.vocabFocus.join(', ')}</p>
        <p><strong>Ngữ pháp trọng tâm:</strong> ${lesson.grammarFocus}</p>
      </div>
    `).join('')}
    <button class="primary-btn" id="complete-unit-btn">Đánh dấu hoàn thành +10%</button>
  `;
  qs('#screen-overlay').classList.remove('hidden');
  qs('#learning-screen').classList.remove('hidden');
  document.body.classList.add('no-scroll');
  qs('#complete-unit-btn').addEventListener('click', () => {
    state.unitProgress[unit.id] = Math.min((state.unitProgress[unit.id] || 0) + 10, 100);
    saveState();
    updateProfileUI();
    closeLessonDetail();
  });
}

function closeLessonDetail() {
  qs('#screen-overlay').classList.add('hidden');
  qs('#learning-screen').classList.add('hidden');
  if (state.onboardingDone) document.body.classList.remove('no-scroll');
}

function renderChapters() {
  qs('#chapter-groups').innerHTML = content.chapters.map(group => `
    <div class="chapter-group">
      <div class="view-header compact"><div><h3>${group.group}</h3></div></div>
      <div class="chapter-items">
        ${group.items.map(item => `<article class="chapter-card card lesson-open" data-unit="${item.id}"><h3>${item.title}</h3><p>${item.summary}</p><p><strong>${item.lessons.length}</strong> bài • <strong>${item.quizCount}</strong> quiz • <strong>${state.unitProgress[item.id] || 0}%</strong></p><div class="lesson-tags">${item.tags.map(tag => `<span class="lesson-tag">${tag}</span>`).join('')}</div></article>`).join('')}
      </div>
    </div>`).join('');
  qsa('.lesson-open').forEach(card => card.addEventListener('click', () => openLessonDetail(card.dataset.unit)));
}

function renderQuick7() { const todayIdx = dayIndex(content.quick7Days.length); qs('#quick7-grid').innerHTML = content.quick7Days.map((item, idx) => `<article class="feature-card card"><h3>${item.day} - ${item.title}</h3><p>${item.focus}</p>${idx===todayIdx?'<p><strong>⭐ Gợi ý hôm nay</strong></p>':''}</article>`).join(''); }
function renderSpeak30() { const day = dayIndex(content.speak30Days.length); qs('#speak30-grid').innerHTML = content.speak30Days.map((item, idx) => `<article class="feature-card card"><h3>Day ${item.day}: ${item.title}</h3><p><strong>Từ khóa:</strong> ${item.keywords.join(', ')}</p><p><strong>Mẫu câu:</strong> ${item.phrase}</p>${idx===day?'<p><strong>🔥 Day gợi ý hiện tại</strong></p>':''}</article>`).join(''); }

function renderTopics() {
  qs('#topic-groups').innerHTML = `<article class="topic-card card filter-card"><h3>Bộ lọc từ mới</h3><div class="lesson-tags" id="word-filters"></div></article>${content.topics.map(topic => `<article class="topic-card card"><h3>${topic.title}</h3><p>${topic.words.join(' • ')}</p></article>`).join('')}`;
  qs('#topic-field-grid').innerHTML = content.topics.map(topic => `<article class="feature-card card"><h3>${topic.title}</h3><p>${topic.words.join(', ')}</p></article>`).join('');
  const uniqueTopics = ['all', ...new Set(content.vocabulary.map(v => v.topic))];
  qs('#word-filters').innerHTML = uniqueTopics.map(topic => `<button class="secondary-btn word-filter ${currentWordFilter===topic?'active-filter':''}" data-topic="${topic}">${topic}</button>`).join('');
  qsa('.word-filter').forEach(btn => btn.addEventListener('click', () => { currentWordFilter = btn.dataset.topic; renderTopics(); renderVocabulary(); }));
}

function toggleSaveWord(word) { const idx = state.savedWords.indexOf(word); if (idx>=0) state.savedWords.splice(idx,1); else state.savedWords.push(word); saveState(); renderVocabulary(); renderSavedWordsBox(); }
function renderVocabulary() {
  let words = content.vocabulary; if (currentWordFilter !== 'all') words = words.filter(v => v.topic === currentWordFilter);
  const dailySet = new Set(getDailyWords(12).map(w => w.korean));
  qs('#vocab-list').innerHTML = words.map(item => `<div class="vocab-item"><div class="vocab-card-inner"><div class="vocab-face front"><div class="vocab-top"><h3>${item.korean}</h3><span class="vocab-tag">${item.topic}</span></div><div class="vocab-meta"><div><strong>Romanized:</strong> ${item.romanized}</div><div><strong>Phiên âm Việt:</strong> ${item.vietnamesePronunciation}</div></div><div class="vocab-meaning">${dailySet.has(item.korean) ? '⭐ Từ trong gói hôm nay' : 'Chạm để xem nghĩa'}</div><button class="icon-btn save-word" data-word="${item.korean}" type="button">${state.savedWords.includes(item.korean) ? '★' : '☆'}</button></div><div class="vocab-face back"><div class="vocab-top"><h3>${item.meaning}</h3><span class="vocab-tag">${item.level}</span></div><div class="vocab-meta"><div><strong>Ngữ cảnh:</strong> ${item.context}</div></div><div class="vocab-meaning">Lật lại để tiếp tục</div></div></div></div>`).join('');
  qsa('.vocab-item').forEach(card => card.addEventListener('click', (e) => { if (e.target.closest('.save-word')) return; card.classList.toggle('flipped'); }));
  qsa('.save-word').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); toggleSaveWord(btn.dataset.word); }));
}

function renderGrammar() {
  const blocks = [{ title: 'Ngữ pháp cơ bản', items: content.grammar.basic },{ title: 'Ngữ pháp trung cấp', items: content.grammar.intermediate },{ title: 'Ngữ pháp nâng cao', items: content.grammar.advanced }];
  qs('#grammar-sections').innerHTML = blocks.map(block => `<article class="grammar-card-item card"><h3>${block.title}</h3>${block.items.map(item => `<div class="grammar-pattern">${item.pattern}</div><p><strong>${item.title}</strong></p><p>${item.example}</p>`).join('')}</article>`).join('');
}
function renderDialogues() { qs('#dialogue-list').innerHTML = content.dialogues.map(dialogue => `<article class="dialogue-card card"><h3>${dialogue.title}</h3>${dialogue.lines.map(line => `<div class="dialogue-line"><div class="speaker">${line.speaker}</div><div><div class="line-korean">${line.korean}</div><div class="line-vietnamese">${line.vietnamese}</div></div></div>`).join('')}</article>`).join(''); }
function renderTopik() { qs('#topik-grid').innerHTML = `<article class="feature-card card"><h3>TOPIK I</h3><p>${content.topik.topik1.join(' • ')}</p></article><article class="feature-card card"><h3>TOPIK II</h3><p>${content.topik.topik2.join(' • ')}</p></article><article class="feature-card card"><h3>Chiến thuật làm bài</h3><p>${content.topik.strategies.join(' • ')}</p></article><article class="feature-card card"><h3>Exam Modes</h3><p>${content.examCenter.practiceModes.join(' • ')}</p></article><article class="feature-card card"><h3>Mock Center</h3><p>${content.examCenter.topikMock.join(' • ')}</p></article><article class="feature-card card"><h3>Daily Review</h3><p>${content.examCenter.dailyReview.join(' • ')}</p></article>`; }

function renderTests() {
  qs('#test-cards').innerHTML = `${content.tests.map(test => `<article class="test-card card"><h3>${test.title}</h3><p>${test.summary}</p></article>`).join('')}<article class="test-card card"><h3>Lịch sử quiz gần đây</h3><p>${state.quizHistory.length ? state.quizHistory.slice(-5).reverse().map(h => `${h.date}: ${h.score}/${h.total}`).join('<br>') : 'Chưa có lịch sử làm bài.'}</p></article>`;
  const dailyQuiz = getDailyQuizSet(12);
  qs('#quiz-form').innerHTML = dailyQuiz.map((q, idx) => `<div class="quiz-question"><div class="quiz-question-head"><div class="question-number">${idx + 1}</div><strong>${q.question}</strong></div><div class="quiz-options">${q.options.map(opt => `<label class="quiz-option"><input type="radio" name="question-${q.id}" value="${opt}"><span>${opt}</span></label>`).join('')}</div></div>`).join('');
}

function submitQuiz() {
  const activeQuiz = getDailyQuizSet(12);
  let score = 0;
  const results = activeQuiz.map(q => {
    const checked = document.querySelector(`input[name="question-${q.id}"]:checked`);
    const userAnswer = checked ? checked.value : null;
    const correct = userAnswer === q.answer;
    if (correct) score++;
    return { ...q, correct, userAnswer };
  });
  const gainedXp = score * 20;
  state.totalXp += gainedXp;
  if (score >= Math.ceil(activeQuiz.length * 0.8)) state.badges += 1;
  state.quizHistory.push({ date: new Date().toLocaleDateString('vi-VN'), score, total: activeQuiz.length });
  state.quizHistory = state.quizHistory.slice(-20);
  saveState(); updateProfileUI(); renderAppInfo(); renderTests();
  qs('#quiz-result').classList.remove('hidden');
  qs('#quiz-result').innerHTML = `<strong>Kết quả:</strong> ${score}/${activeQuiz.length} câu đúng • +${gainedXp} XP<br><br>${results.map(r => `${r.correct ? '✅' : '❌'} ${r.question}<br><span class="muted">Đáp án đúng: <strong>${r.answer}</strong>${r.userAnswer ? ` • Bạn chọn: ${r.userAnswer}` : ' • Bạn chưa chọn'}</span>`).join('<br><br>')}`;
}

function bindUI() {
  qs('#submit-quiz').addEventListener('click', submitQuiz);
  qs('#menu-toggle').addEventListener('click', () => qs('#sidebar').classList.toggle('open'));
  qs('#theme-toggle').addEventListener('click', toggleTheme);
  qs('#theme-toggle-mobile').addEventListener('click', toggleTheme);
  qs('#mark-study-done').addEventListener('click', markStudyDone);
  qs('#open-learning-path').addEventListener('click', () => switchScreen('learn'));
  qsa('.goal-btn').forEach(btn => btn.addEventListener('click', () => selectGoal(btn)));
  qs('#start-app').addEventListener('click', startApp);
  qsa('.app-tab').forEach(tab => tab.addEventListener('click', () => switchScreen(tab.dataset.screen)));
  qsa('.close-screen').forEach(btn => btn.addEventListener('click', closeLessonDetail));
  qs('#screen-overlay').addEventListener('click', closeLessonDetail);
}

function toggleTheme() { state.darkMode = !state.darkMode; saveState(); applyTheme(); }
function markStudyDone() { state.streak += 1; if (state.streak % 3 === 0) state.badges += 1; saveState(); updateProfileUI(); }
function selectGoal(btn) { qsa('.goal-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); state.goal = btn.dataset.goal; }
function startApp() { state.onboardingDone = true; saveState(); qs('#onboarding').classList.add('hidden'); document.body.classList.remove('no-scroll'); updateProfileUI(); }
function initOnboarding() { if (!state.onboardingDone) { qs('#onboarding').classList.remove('hidden'); document.body.classList.add('no-scroll'); } qsa('.goal-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.goal === state.goal)); }

async function init() {
  loadState(); applyTheme();
  const res = await fetch('./data/content.json'); content = await res.json();
  renderAppInfo(); renderLearnModules(); renderChapters(); renderQuick7(); renderSpeak30(); renderTopics(); renderVocabulary(); renderGrammar(); renderDialogues(); renderTopik(); renderTests(); updateProfileUI(); bindUI(); initOnboarding(); switchScreen(state.screen || 'home');
}

init().catch(() => { document.body.innerHTML = '<div style="padding:24px;font-family:Arial,sans-serif;">Không tải được dữ liệu khóa học.</div>'; });