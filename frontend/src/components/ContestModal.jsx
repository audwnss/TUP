import React, { useState, useEffect, useRef } from 'react';
import Modal from '@mui/material/Modal';
import CloseIcon from '@mui/icons-material/Close';
import SkillManager from './SkillManager';
import TeamList from './TeamList';
import FeedbackModal from './FeedbackModal';
import { calculateDday } from '../utils/dateUtils';
import GroupsIcon from '@mui/icons-material/Groups';
import { toast } from 'react-toastify';


const ContestModal = ({
  open,
  onClose,
  selectedContest,
  users,
  setUsers,
  userSkills,
  setUserSkills,
  feedbacks,
  onFeedback,
  currentUser
}) => {
  const [mainRole, setMainRole] = useState('');
  const [subRole, setSubRole] = useState('');
  const [matched, setMatched] = useState([]);  // ✅ 팀 목록 상태 정의
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const hasShownToast = useRef(false);
  const formRef = useRef(null);
  const queueRef = useRef(null); 
  const [isHovered, setIsHovered] = useState(false);
  const [isTeamHovered, setIsTeamHovered] = useState(false);
  const [isFeedbackHovered, setIsFeedbackHovered] = useState(false);
  const [isTeamroomHovered, setIsTeamroomHovered] = useState(false);

  const scrollToBoth = () => {
  formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  queueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
  useEffect(() => {
    const alreadySaved = users.some(u => u.id === currentUser?.id);
    if (open && !hasShownToast.current && !alreadySaved) {
    toast.info("공모전 입력란(역량 키워드, 역할군 등)을 먼저 작성해주세요!");
    hasShownToast.current = true;
    }
  }, [open, users, currentUser]);
  const isMatched = matched.some(team =>
    team.some(member => member.id === currentUser?.id)
  );
// ✅ 재매칭 함수
const handleRematch = () => {
  const myTeam = matched.find(team =>
    team.some(member => member.id === currentUser?.id)
  );
  if (!myTeam) return;

  const agreedUsers = myTeam.filter(member =>
    feedbacks[member.id] === '👍'
  );

  const unmatchedUsers = users.filter(u =>
    !matched.some(team => team.some(m => m.id === u.id))
  );
  const needed = 4 - agreedUsers.length;
  const shuffled = [...unmatchedUsers].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, needed);
  const newTeam = [...agreedUsers, ...selected];

  if (newTeam.length === 4) {
    setMatched(prev => [
      ...prev.filter(team => team !== myTeam),
      newTeam
    ]);
    setUsers(prev => prev.filter(u => !selected.some(s => s.id === u.id)));
    toast.success("재매칭 완료!");
  } else {
    toast.warning("재매칭 인원이 부족합니다.");
  }
};

// ✅ 비동의 인원 대기열로 이동
const handleRequeue = () => {
  const myTeam = matched.find(team =>
    team.some(member => member.id === currentUser?.id)
  );
  if (!myTeam) return;

  const disagreedUsers = myTeam.filter(member =>
    feedbacks[member.id] === '👎'
  );

  setUsers(prev => [
    ...prev.filter(u => !disagreedUsers.some(d => d.id === u.id)),
    ...disagreedUsers
  ]);

  setMatched(prev =>
    prev.filter(team => team !== myTeam)
  );

  toast.info("대기열로 이동했어요.");
};



  const handleSave = () => {
  if (isMatched) {
    toast.warning("이미 팀에 속해 있어 수정할 수 없습니다.");
    return;
  }

  if (userSkills.length === 0 || !mainRole.trim()) {
    toast.warning("역량 키워드와 희망 역할군을 모두 입력해주세요.");
    return;
  }

  if (!currentUser || !currentUser.id) {
    toast.error("현재 사용자 정보가 없습니다.");
    return;
  }

  const newUser = {
    id: currentUser.id,
    name: currentUser.name || "나",
    skills: userSkills,
    keywords: userSkills,
    mainRole,
    subRole,
    rating: currentUser.rating ?? null,
    participation: currentUser.participation ?? 0
  };

  const alreadyInQueue = users.some(user => user.id === currentUser.id);

  if (alreadyInQueue) {
    setUsers(prev =>
      prev.map(user =>
        user.id === currentUser.id ? newUser : user
      )
    );
    toast.info("기존 정보를 수정했어요.");
  } else {
    setUsers(prev => [...prev, newUser]);
    toast.success("저장 완료! 대기열에 추가되었습니다.");
  }
};
  const matchTeam = () => {
    if (users.length < 4) {
    toast.info("대기 인원이 부족해요! 팀업을 기다려주세요 😊");
    return;
  }
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    const teamSize = 4;
    const teams = [];

    for (let i = 0; i < Math.floor(shuffled.length / teamSize) * teamSize; i += teamSize) {
      teams.push(shuffled.slice(i, i + teamSize));
    }

    const matchedIds = teams.flat().map(user => user.id);
    const remaining = shuffled.filter(user => !matchedIds.includes(user.id));
    setMatched(prev => [...prev, ...teams]);
    setUsers(remaining);
    toast.success("팀 매칭 완료!");
  };

  if (!selectedContest) return null;

  const {
    title,
    image,
    category,
    deadline,
    start,
    organizer
  } = selectedContest;

  const myTeam = matched.find(team =>
    team.some(member => member.id === currentUser?.id)
  );

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <div style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
            <button onClick={onClose} style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}>
              <CloseIcon />
            </button>
          </div>

          <div style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            padding: '0 2rem 2rem 2rem',
            gap: '2rem'
          }}>
            <div style={{ width: '40%', overflowY: 'auto' }}>
              <img
                src={image}
                alt="공모전"
                style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }}
              />
              <h2 style={{ fontFamily: "'Montserrat', 'Noto Sans KR'", fontWeight: 800 }}>{title}</h2>
              <div style={{
                background: '#F8F9FA',
                padding: '1rem',
                borderRadius: '8px'
              }}>
                <p>• 주최: {organizer}</p>
                <p>• 일정: {start} ~ {deadline}</p>
                <p>• 마감: {calculateDday(deadline)}</p>
                <p>• 분야: {category}</p>
              </div>

              <div ref={formRef} style={{ marginTop: '1rem' }}>
                <SkillManager
                  skills={userSkills}
                  setSkills={setUserSkills}
                  mainRole={mainRole}
                  setMainRole={setMainRole}
                  subRole={subRole}
                  setSubRole={setSubRole}
                  disabled={isMatched}
                />
                {isMatched && (
                  <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    ⚠ 팀에 속한 상태에서는 입력을 수정할 수 없습니다.
                  </p>
                )}
              <button
                  onClick={handleSave}
                  disabled={isMatched}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: isMatched
                      ? '#ccc'
                      : isHovered
                      ? '#ff824e' // hover 시 밝은 오렌지
                      : '#FF6B35',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    marginTop: '1.5rem',
                    fontFamily: "'Montserrat', 'Noto Sans KR'",
                    cursor: isMatched ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: isMatched ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.2s ease-in-out',
                    transform: isHovered && !isMatched ? 'translateY(-1px)' : 'translateY(0)',
                  }}
                >
                  Save!
                </button>

              </div>
            </div>

            <div style={{ width: '60%', overflowY: 'auto' }}>
              <h2 style={{
                color: '#FF6B35',
                fontFamily: "'Montserrat', 'Noto Sans KR'",
                fontWeight: 800
              }}>
                <GroupsIcon style={{ marginRight: '0.5rem' }} />
                함께하자 팀으로!
              </h2>

         
              <div ref={queueRef} style={{
                listStyle: 'none',
                padding: 0,
                maxHeight: '200px',
                overflowY: 'auto',
                marginBottom: '1rem',
                background: '#FFF9F7',
                borderRadius: '8px',
                paddingInline: '1rem'
              }}>
                {users.map(user => (
                  <li key={user.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.8rem 0',
                    borderBottom: '1px solid #eee',
                    fontWeight: 500,
                    fontSize: '1rem',
                    color: '#333'
                  }}>
                    
                  👤  {user.name}
                  </li>
                ))}
                </div>
                          {/* 팀업 버튼 또는 안내 메시지 */}
              {myTeam ? (
                <p style={{
                  maxWidth: '100%',    
                  width: '100%',
                  padding: '1rem',
                  background: '#FFF3ED',
                  color: '#FF6B35',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '1rem',
                  border: '1px solid #FF6B35',
                  boxSizing: 'border-box'       // ✅ 패딩 포함해서 너비 계산
                }}>
                  이미 팀에 속해 있어요! 결과를 기다려주세요 😊
                </p>
              ) : (
             <button
              onClick={matchTeam}
              onMouseEnter={() => setIsTeamHovered(true)}
              onMouseLeave={() => setIsTeamHovered(false)}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: isTeamHovered ? '#ff824e' : '#FF6B35', // hover 시 밝은 주황
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: '1rem',
                fontFamily: "'Montserrat', 'Noto Sans KR'",
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease-in-out',
                transform: isTeamHovered ? 'translateY(-1px)' : 'translateY(0)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <GroupsIcon style={{ marginRight: '0.5rem' }} />
              TEAM UP!
            </button>
              )}
       
              {matched.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <TeamList
                    matched={matched}
                    feedbacks={feedbacks}
                    onFeedback={onFeedback}
                    currentUser={currentUser}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginTop: '1.5rem',
                    paddingBottom: '1rem'
                  }}>
                    <button
                    onMouseEnter={() => setIsFeedbackHovered(true)}
                    onMouseLeave={() => setIsFeedbackHovered(false)}
                    onClick={() => setIsFeedbackModalOpen(true)}
                    style={{
                      flex: 1,
                      padding: '0.9rem', // 기존 크기 유지
                      backgroundColor: isFeedbackHovered ? '#ff824e' : '#FF6B35',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      fontFamily: "'Montserrat', 'Noto Sans KR'",
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      transition: 'background-color 0.2s ease, transform 0.2s ease',
                      transform: isFeedbackHovered ? 'translateY(-1px)' : 'translateY(0)',
                    }}
                  >
                    피드백 결과 확인하기
                  </button>
                   <button
                      onMouseEnter={() => setIsTeamroomHovered(true)}
                      onMouseLeave={() => setIsTeamroomHovered(false)}
                      onClick={() => window.open('/TeamPage', '_blank')}
                      style={{
                        flex: 1,
                        padding: '0.9rem', // 기존 세로 크기 유지
                        backgroundColor: isTeamroomHovered ? '#ff824e' : '#FF6B35',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        fontFamily: "'Montserrat', 'Noto Sans KR'",
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transition: 'background-color 0.2s ease, transform 0.2s ease',
                        transform: isTeamroomHovered ? 'translateY(-1px)' : 'translateY(0)',
                      }}
                    >
                      팀룸으로 이동하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <FeedbackModal
        open={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        team={myTeam || []}
        feedbacks={feedbacks}
        currentUser={currentUser}
        scrollToBoth={scrollToBoth}
        onRematch={handleRematch}       // ✅ 추가
        onRequeue={handleRequeue}       // ✅ 추가
        users={users}
      />
    </>
  );
};

export default ContestModal;
