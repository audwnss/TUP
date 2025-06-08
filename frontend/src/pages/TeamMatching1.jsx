import React, { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import DrawerMenu from '../components/DrawerMenu';
import ContestModal from '../components/ContestModal';
import { calculateDday } from '../utils/dateUtils';
import './TeamMatching1.css';
import dummyUsers from '../data/dummyUsers.json'; 


// 공모전 목록 데이터
const contestList = [
  {
    id: 1,
    title: "2025 AWS x Codetree 프로그래밍 경진대회",
    description: "클라우드 환경에서의 문제 해결 프로그래밍",
    category: "프로그래밍, 클라우드",
    deadline: "2025-05-16",
    start: "2025-04-21",
    organizer: "AWS / 코드트리",
    image: "/aws.png"
  },
  {
    id: 2,
    title: "제7회 서울교육 데이터 분석·활용 아이디어 공모전",
    description: "교육 데이터를 활용한 분석 및 시각화",
    category: "데이터/코딩",
    deadline: "2025-06-01",
    start: "2025-04-21",
    organizer: "서울특별시교육청",
    image: "/seoul.png"
  },
  {
    id: 3,
    title: "2025년 경기도서관 크리에이티브 시너지 공모전",
    description: "공공도서관 시스템 개선 아이디어 공모",
    category: "IT기획/프로그래밍",
    deadline: "2025-06-30",
    start: "2025-04-09",
    organizer: "경기도 / 경기도서관",
    image: "/creative.png"
  },
  {
    id: 4,
    title: "2025 GH 공간복지 청년 공모전",
    description: "공간 기술 기반의 아이디어 및 프로토타입 공모",
    category: "공간IT/UX설계",
    deadline: "2025-06-29",
    start: "2025-06-02",
    organizer: "경기주택도시공사",
    image: "/gh.png"
  },
  {
    id: 5,
    title: "제6회 뉴스읽기 뉴스일기 공모전",
    description: "뉴스 데이터를 활용한 콘텐츠 기획",
    category: "미디어/코딩교육",
    deadline: "2025-07-31",
    start: "2025-04-07",
    organizer: "한국언론진흥재단",
    image: "/news.png"
  }
];

function TeamMatching1() {
  const currentUser = {
    id: 99,
    name: "이명준",
    rating: 4.8,
    participation: 2
  };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [userSkills, setUserSkills] = useState([]);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [users, setUsers] = useState(dummyUsers);
  

 const handleMatchTeam = () => {
  const shuffled = [...users].sort(() => Math.random() - 0.5);
  const teamSize = 4;
  const teams = [];
  const leftover = [];

  for (let i = 0; i < shuffled.length; i += teamSize) {
    const teamMembers = shuffled.slice(i, i + teamSize);
    if (teamMembers.length === teamSize) {
      teams.push(teamMembers);
    } else {
      leftover.push(...teamMembers);
    }
  }

  setMatchedUsers(teams);   // ex: [[팀1], [팀2]]
  setUsers(leftover);       // 남은 인원만 다시 대기열에 유지
};
 

  const handleFeedback = (userId, type) => {
    setFeedbacks(prev => ({ ...prev, [userId]: type }));
  };

  return (
    <div className="team-matching-container">
      {/* 헤더 */}
      <header className="team-matching-header">
        <span className="logo">TUP!</span>
        {!drawerOpen && (
          <button
            className="menu-button"
            onClick={() => setDrawerOpen(true)}
            aria-label="메뉴 열기"
          >
            <MenuIcon style={{ fontSize: '2.2rem', color: '#FF6B35' }} />
          </button>
        )}
      </header>

      {/* 드로어 메뉴 */}
      <DrawerMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        openMenus={openMenus}
        onToggle={setOpenMenus}
      />

      {/* 소개 문구 */}
      <div className="matching-intro">
        <h1>
          <span className="highlight">AutoTeamUp</span> - 빠르게 팀 결성하기
        </h1>
        <p>
          공모전을 선택한 참가자들이 랜덤으로 팀을 결성한 후, <strong>2차 피드백</strong>을 통해 최종 팀을 확정하는 방식입니다
        </p>
      </div>

            {/* 공모전 카드 리스트 */}
      <section className="contest-list-section">
        <h3 className="contest-section-title">📢 공모전을 찾아 팀업 진행하기</h3>
        <div className="contest-grid">
          {contestList.map(contest => (
            <div
              key={contest.id}
              className="hover-card"
              onClick={() => {
                setSelectedContest(contest);
                setModalOpen(true);
              }}
            >
              <img src={contest.image} alt="공모전" className="hover-image" />
              <div className="hover-details">
                <h3>{contest.title}</h3>
                <p>마감: {contest.deadline} ({calculateDday(contest.deadline)})</p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* 공모전 모달 */}
      {selectedContest && (
        <ContestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedContest={selectedContest}
          users={users}
          setUsers={setUsers}  // ✅ 이 줄 추가!
          userSkills={userSkills}
          setUserSkills={setUserSkills}
          matched={matchedUsers}
          matchTeam={handleMatchTeam}
          feedbacks={feedbacks}
          onFeedback={handleFeedback}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

export default TeamMatching1;

