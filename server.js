const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const VOCAB_FILE = path.join(DATA_DIR, 'vocab.json');
const QUIZ_FILE = path.join(DATA_DIR, 'quiz.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

app.get('/api/vocab', (req, res) => {
  try {
    const data = readJson(VOCAB_FILE);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Không thể đọc dữ liệu từ vựng.' });
  }
});

app.get('/api/quiz', (req, res) => {
  try {
    const data = readJson(QUIZ_FILE);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Không thể đọc dữ liệu bài thi.' });
  }
});

app.post('/api/submit-quiz', (req, res) => {
  try {
    const { answers } = req.body;
    const questions = readJson(QUIZ_FILE);
    let score = 0;

    const results = questions.map((q) => {
      const userAnswer = answers?.[q.id];
      const correct = userAnswer === q.answer;
      if (correct) score++;
      return {
        id: q.id,
        question: q.question,
        userAnswer,
        correctAnswer: q.answer,
        correct
      };
    });

    res.json({
      total: questions.length,
      score,
      results
    });
  } catch (err) {
    res.status(500).json({ error: 'Không thể chấm điểm bài thi.' });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Korean Learning Web đang chạy tại http://0.0.0.0:${PORT}`);
});
