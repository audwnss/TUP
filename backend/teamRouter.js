const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

let users = [];
let teams = [];
let confirmedTeams = [];
let waitingQueue = [];
const teamSize = 4;

// ✅ 더미 유저 로딩
try {
  const dummyPath = path.join(__dirname, '../frontend/src/data/dummyUsers.json');
  const dummyData = JSON.parse(fs.readFileSync(dummyPath, 'utf-8'));
  users = [...dummyData];
  waitingQueue = [...dummyData];
  console.log(`[✅ 더미 유저 로딩 완료] ${users.length}명`);
} catch (err) {
  console.error('❌ dummyUsers.json 로딩 실패:', err.message);
}

function randomShuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function filterExcluded(users, excludedIds) {
  return users.filter(user => !excludedIds.includes(user.id));
}

function createTeams() {
  let shuffled = randomShuffle([...waitingQueue]);
  let newTeams = [];

  while (shuffled.length >= teamSize) {
    const teamMembers = shuffled.splice(0, teamSize);
    const teamId = `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const team = {
      id: teamId,
      members: teamMembers,
      feedbacks: teamMembers.map(u => ({ userId: u.id, feedback: 'pending' })),
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      status: '대기 중',
    };
    newTeams.push(team);

    waitingQueue = waitingQueue.filter(u => !teamMembers.find(m => m.id === u.id));
    teams.push(team);
  }

  return newTeams;
}

function generateRoomInfo(teamId) {
  const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    chatRoom: { roomId, roomLink: `/chat/${roomId}`, type: 'chat' },
    projectRoom: { roomId, projectLink: `/project/${roomId}`, type: 'project' },
  };
}

setInterval(() => {
  teams.forEach(team => {
    if (team.status === '대기 중' && Date.now() > team.expiresAt) {
      console.log(`⏰ [자동처리] 팀 ${team.id} 만료됨 - 대기열로 복귀`);
      const pendingUsers = team.members.filter(m =>
        team.feedbacks.find(f => f.userId === m.id && f.feedback === 'pending')
      );
      pendingUsers.forEach(user => {
        if (!user.excluded) user.excluded = [];
        user.excluded.push(...team.members.map(m => m.id));
        waitingQueue.push(user);
      });

      team.members = team.members.filter(m => !pendingUsers.find(p => p.id === m.id));
      team.feedbacks = team.feedbacks.filter(f => !pendingUsers.find(p => p.userId === f.userId));

      const needed = teamSize - team.members.length;
      const available = filterExcluded(waitingQueue, team.members.map(m => m.id));

      let added = 0;
      while (added < needed && available.length > 0) {
        const newMember = available.shift();
        team.members.push(newMember);
        team.feedbacks.push({ userId: newMember.id, feedback: 'pending' });
        waitingQueue = waitingQueue.filter(u => u.id !== newMember.id);
        added++;
      }
    }
  });
}, 10 * 60 * 1000);

// ✅ 대기열 조회 API 추가
router.get('/waiting', (req, res) => {
  res.json({
    success: true,
    data: { waitingQueue }
  });
});

// ✅ 팀 신청
router.post('/apply', (req, res) => {
  const user = req.body;
 // ✅ 1. 이미 팀에 속한 유저는 다시 대기열에 들어가지 못하게 차단
  const alreadyInTeam = teams.some(team =>
    team.members?.some(member => member.id === user.id)
  );

  if (alreadyInTeam) {
    return res.json({
      success: false,
      message: '이미 팀에 속한 사용자는 정보를 수정할 수 없습니다.'
    });
  }

  const existingUser = users.find(u => u.id === user.id);

  if (!existingUser) {
    users.push(user);
    waitingQueue.push(user);
  } else {
    Object.assign(existingUser, user);
    if (!waitingQueue.find(u => u.id === user.id)) {
      waitingQueue.push(existingUser);
    }
  }

  res.json({
    success: true,
    message: '⏳ 대기열에 추가됨',
    data: {
      waitingQueue,
      createdTeams: []
    }
  });
});

// ✅ 팀 생성 전용 API (TEAM UP 버튼용)
router.post('/teamup', (req, res) => {
  let createdTeams = [];

  if (waitingQueue.length >= teamSize) {
    createdTeams = createTeams();
  }

  res.json({
    success: true,
    message: createdTeams.length > 0 ? '✅ 팀 매칭 완료' : '대기 인원이 부족하여 매칭되지 않았습니다.',
    data: {
      createdTeams
    }
  });
});

// ✅ 피드백 처리
router.post('/feedback', (req, res) => {
  const { teamId, userId, feedback } = req.body;

  const team = teams.find(t => t.id === teamId);
  if (!team) return res.status(404).json({ success: false, errorCode: 'TEAM_NOT_FOUND' });

  const feedbackObj = team.feedbacks.find(f => f.userId === userId);
  if (!feedbackObj) return res.status(404).json({ success: false, errorCode: 'MEMBER_NOT_FOUND' });

  // ✅ 문자열로 상태 업데이트
  if (!['agree', 'disagree'].includes(feedback)) {
    return res.status(400).json({ success: false, message: '잘못된 피드백 값' });
  }

  feedbackObj.feedback = feedback;

  const allFeedbacks = team.feedbacks;
  const disagreed = allFeedbacks.filter(f => f.feedback === 'disagree').length;
  const pending = allFeedbacks.filter(f => f.feedback === 'pending').length;

  if (pending > 0) {
    return res.json({ success: true, message: '대기 중', data: { team } });
  }

  if (disagreed > 0) {
    const disagreeUsers = team.members.filter(m =>
      allFeedbacks.find(f => f.userId === m.id && f.feedback === 'disagree')
    );
    disagreeUsers.forEach(user => {
      if (!user.excluded) user.excluded = [];
      user.excluded.push(...team.members.map(m => m.id));
      waitingQueue.push(user);
    });

    team.members = team.members.filter(m => !disagreeUsers.find(d => d.id === m.id));
    team.feedbacks = team.feedbacks.filter(f => !disagreeUsers.find(d => d.userId === f.userId));

    const needed = teamSize - team.members.length;
    const available = filterExcluded(waitingQueue, team.members.map(m => m.id));
    let added = 0;
    while (added < needed && available.length > 0) {
      const newMember = available.shift();
      team.members.push(newMember);
      team.feedbacks.push({ userId: newMember.id, feedback: 'pending' });
      waitingQueue = waitingQueue.filter(u => u.id !== newMember.id);
      added++;
    }

    return res.json({
      success: true,
      message: '비동의자 제외 후 팀 재구성',
      data: {
        team: {
          ...team,
          feedbacks: team.feedbacks
        }
      }
    });
  }

  team.status = '확정 완료';
  const roomInfo = generateRoomInfo(teamId);
  confirmedTeams.push({ ...team, roomInfo });
  teams = teams.filter(t => t.id !== teamId);

  return res.json({
    success: true,
    message: '✅ 팀 확정 완료!',
    data: {
      team: {
        ...team,
        status: '확정 완료',
        feedbacks: team.feedbacks
      },
      chatRoom: roomInfo.chatRoom,
      projectRoom: roomInfo.projectRoom
    }
  });
});

// ✅ 수동 재매칭
router.post('/resolve', (req, res) => {
  const { teamId, action } = req.body;
  const team = teams.find(t => t.id === teamId);
  if (!team) return res.status(404).json({ success: false, message: '팀 없음' });

  const disagreedUsers = team.members.filter(m => {
    const feedback = team.feedbacks.find(f => f.userId === m.id)?.feedback;
    return feedback === 'disagree';
  });

  if (action === 'requeue') {
    disagreedUsers.forEach(user => {
      if (!user.excluded) user.excluded = [];
      user.excluded.push(...team.members.map(m => m.id));
      waitingQueue.push(user);
    });
    return res.json({ success: true, message: '비동의자 대기열 복귀 완료', data: { waitingQueue } });
  }

  if (action === 'rematch') {
    const agreedUsers = team.members.filter(m => !disagreedUsers.find(d => d.id === m.id));
    const newTeamId = `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTeam = {
      id: newTeamId,
      members: agreedUsers,
      feedbacks: agreedUsers.map(u => ({ userId: u.id, feedback: 'pending' })),
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      status: '대기 중'
    };
    teams.push(newTeam);
    return res.json({
      success: true,
      message: '재매칭 팀 구성 완료',
      data: {
        team: {
          ...newTeam,
          feedbacks: newTeam.feedbacks
        }
      }
    });
  }

  return res.status(400).json({ success: false, message: '알 수 없는 요청' });
});

// ✅ teams 조회 API 추가
router.get('/teams', (req, res) => {
  res.json({
    success: true,
    data: { teams }
  });
});

module.exports = router;
