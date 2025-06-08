// server.js - dummyUsers.json 기반 백엔드 서버
const express = require('express');
const cors = require('cors');
const path = require('path');
const teamRouter = require('./teamRouter'); 
const app = express();
const fs = require('fs');
require('dotenv').config();


const PORT = process.env.PORT || 5000;

// ============================================
// 데이터 로딩 및 상태 관리
// ============================================
const loadDummyUsers = () => {
  const filePath = path.join(__dirname, '../frontend/src/data/dummyUsers.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

let waitingQueue = loadDummyUsers();
let matchedTeams = []; // [{ id, members: [...], feedback: [...] }]
let feedbacks = [];    // [{ teamId, userId, result }]

// ============================================
// 미들웨어 설정
// ============================================
app.use(cors());
app.use(express.json());
app.use('/api/teamup', teamRouter);
// ============================================
// 팀 매칭 신청
// ============================================
app.post('/api/teamup/apply', (req, res) => {
  const { userId } = req.body;
  const user = waitingQueue.find(u => u.id === userId);
  if (!user) {
    return res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });
  }

  // 대기열에서 중복 제거 후 재추가
  waitingQueue = waitingQueue.filter(u => u.id !== userId);
  waitingQueue.push(user);

  // 대기열에서 4명 이상이면 팀 결성
  let createdTeams = [];
  while (waitingQueue.length >= 4) {
    const newTeam = {
      id: Date.now() + Math.random(),
      members: waitingQueue.splice(0, 4),
      feedback: []
    };
    matchedTeams.push(newTeam);
    createdTeams.push(newTeam);
  }

  res.json({
    success: true,
    data: {
      waitingQueue,
      createdTeams
    }
  });
});

// ============================================
// 피드백 저장
// ============================================
app.post('/api/teamup/feedback', (req, res) => {
  const { teamId, userId, result } = req.body;

  const team = matchedTeams.find(t => t.id === teamId);
  if (!team) return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });

  team.feedback.push({ userId, result });
  feedbacks.push({ teamId, userId, result });

  res.json({ success: true });
});

// ============================================
// 피드백 결과 확인
// ============================================
app.get('/api/teamup/feedback/:teamId', (req, res) => {
  const teamId = Number(req.params.teamId);
  const team = matchedTeams.find(t => t.id === teamId);
  if (!team) return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });

  const allResponded = team.feedback.length === team.members.length;
  const allAgreed = allResponded && team.feedback.every(f => f.result === 'agree');

  res.json({
    success: true,
    team,
    allResponded,
    allAgreed
  });
});

// ============================================
// 팀 해산 / 재매칭 요청
// ============================================
app.post('/api/teamup/resolve', (req, res) => {
  const { teamId, type } = req.body; // type = 'rematch' | 'requeue'
  const teamIndex = matchedTeams.findIndex(t => t.id === teamId);
  if (teamIndex === -1) return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });

  const team = matchedTeams[teamIndex];
  let remaining = [], removed = [];

  if (type === 'rematch') {
    team.feedback.forEach(fb => {
      if (fb.result === 'agree') remaining.push(fb.userId);
      else removed.push(fb.userId);
    });
  } else if (type === 'requeue') {
    removed = team.members.map(m => m.id);
  }

  // 팀 해산
  matchedTeams.splice(teamIndex, 1);

  // 재대기열 등록
  const returningUsers = team.members.filter(m =>
    (type === 'requeue') || (type === 'rematch' && team.feedback.find(f => f.userId === m.id)?.result === 'agree')
  );
  waitingQueue.push(...returningUsers);

  res.json({ success: true, team: { ...team, requeued: returningUsers } });
});

// ============================================
// 상태 확인용
// ============================================
app.get('/api/teamup/status', (req, res) => {
  res.json({
    waitingQueue,
    matchedTeams,
    feedbacks
  });
});

// ============================================
// 서버 시작
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
