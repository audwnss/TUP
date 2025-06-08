import React, { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import tupImg from './tup_img.png';
import './TeamMatching2.css';
import { useNavigate } from 'react-router-dom';
import dummyUsers from '../data/dummyUsers.json'; 
import DrawerMenu from '../components/DrawerMenu';
import { toast } from 'react-toastify';

const allSkills = [
  '리더십','기획력','소통','협업','꼼꼼함','책임감','창의력',
  '분석력','논리력','실행력','시간관리','문제해결','열정',
  '끈기','적응력','발표력','공감력','전략적 사고','자기주도성'
];

const baseTeams = [
  { id: 1, leader: "김민수", skills: ["React", "Node.js"], lookingFor: ["디자이너", "기획자"], category: "웹/앱 서비스 개발", status: "모집중", maxMembers: 4, intro: "열정 가득한 팀장입니다.", mainRole : "PM", subRole : "프론트엔드 개발",  keywords : ["기획력, 리더십"], rating : 4.0, participation : 2 },
  { id: 2, leader: "서지훈", skills: ["Java", "Spring"], lookingFor: ["프론트엔드 엔지니어"], category: "공공데이터 활용 서비스 개발", status: "모집중", maxMembers: 3, intro: "함께 성장할 분을 찾습니다.", mainRole : "백엔드 개발", subRole : "웹 디자인",  keywords : ["꼼꼼함, 책임감"], rating : 4.2, participation : 4 },
  { id: 3, leader: "박영희", skills: ["Flutter", "Firebase"], lookingFor: ["백엔드 개발자"], category: "데이터베이스 관련 운용", status: "모집완료", maxMembers: 5, intro: "저와 함께 성장해요!", mainRole : "DB 구축", subRole : "서버 운용",  keywords : ["시간관리, 열정"], rating : 4.5, participation : 3 }
];



function TeamMatching2() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [userType, setUserType] = useState(null);
  const [memberRegistered, setMemberRegistered] = useState(false);
  const [myProfile, setMyProfile] = useState({ name:"이명준", skills: [], mainRole:"", subRole:"", keywords:[], intro:"" });
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [applicants, setApplicants] = useState(dummyUsers);
  const [filterMode, setFilterMode] = useState(null);
  const [filter, setFilter] = useState({ role:"", skill:"", minRating:0 });
  const [newTeamInfo, setNewTeamInfo] = useState({ skills:"", lookingFor:"", category:"", maxMembers:6, intro:"" });
  const [modalMember, setModalMember] = useState(null);
  const [sentInvites, setSentInvites] = useState([]);
  const [sentApplications, setSentApplications] = useState([]);
  const [inviteMap, setInviteMap] = useState({});       // { userId: [ { id, leader } ] }
  const [applicationMap, setApplicationMap] = useState({}); // { teamId: [ userObj, ... ] }
  const receivedInvites = inviteMap[myProfile.id] || [];
  const receivedApplications = applicationMap[selectedTeam?.id] || [];
  const navigate = useNavigate();

  const dummyTeams = baseTeams.map(team => {
  const leaderProfile = dummyUsers.find(user => user.name === team.leader);

const leaderAsMember = {
  name: team.leader,
  skills: team.skills || [],
  mainRole: team.mainRole || "팀장",
  subRole: team.subRole || "-",
  keywords: team.keywords || ["리더십"],
  rating: team.rating ?? 0,
  participation: team.participation ?? 0,
  intro: team.intro || ""
};


  return {
    ...team,
    members: [leaderAsMember]  // ✅ 팀장 자동 포함!
  };
});

  const handleSimulateAccept = (team) => {
  const alreadyJoined = team.members.some(m => m.name === myProfile.name);
  if (!alreadyJoined) {
    team.members.push({
      name: myProfile.name,
      skills: myProfile.skills,
      mainRole: myProfile.mainRole,
      subRole: myProfile.subRole,
      keywords: myProfile.keywords,
      rating: myProfile.rating || 4.8,
      participation: myProfile.participation || 0
    });
  }
  setSelectedTeam(team);
  setUserType('member');

};

  const forceAccept = (applicant) => {
  setSelectedTeam(prev => ({
    ...prev,
    members: [...prev.members, applicant]
  }));
  setApplicationMap(prev => {
    const updated = { ...prev };
    updated[selectedTeam.id] = updated[selectedTeam.id].filter(u => u.id !== applicant.id);
    return updated;
  });
};
  const MemberModal = ({ member, onClose }) => {
    if (!member) return null;
    return (
      <div className="modal-backdrop">
        <div className="modal-box">
          <h3>{member.name} 님의 정보</h3>
          <p><strong>기술:</strong> {member.skills?.join(', ') || '-'}</p>
          <p><strong>역할:</strong> {member.mainRole || '-'}</p>
          <p><strong>역량:</strong> {member.keywords?.join(', ') || '-'}</p>
          <button onClick={onClose} className="cta-button" style={{ marginTop: '1rem' }}>닫기</button>
        </div>
      </div>
    );
  };
  
  const toggleKeyword = (kw) => {
    setMyProfile(p => {
      const has = p.keywords.includes(kw);
      const next = has ? p.keywords.filter(x => x !== kw) : p.keywords.length < 3 ? [...p.keywords, kw] : p.keywords;
      return { ...p, keywords: next };
    });
  };

const handleCreateTeam = () => {
  const { skills, lookingFor, category, maxMembers, intro } = newTeamInfo;
  const { mainRole, subRole, keywords } = myProfile;

   if (
    !skills.trim() ||
    !lookingFor.trim() ||
    !category.trim() ||
    !intro.trim() ||
    !mainRole.trim() ||
    !subRole.trim() ||
    keywords.length === 0 ||
    !maxMembers || maxMembers < 1
  ) {
    toast.warning("모든 입력 칸을 채워주세요.");
    return;
  }
  const myInfo = {
    name: "이명준",
    skills: newTeamInfo.skills.split(',').map(s => s.trim()),
    mainRole: myProfile.mainRole,
    subRole: myProfile.subRole,
    keywords: myProfile.keywords, // ✅ 키워드 반영 
  };

  const t = {
    id: Date.now(),
    leader: myInfo.name,
    skills: newTeamInfo.skills.split(',').map(s => s.trim()),
    lookingFor: newTeamInfo.lookingFor.split(',').map(s => s.trim()),
    status: "모집중",
    maxMembers: newTeamInfo.maxMembers,
    intro: newTeamInfo.intro,
    category: newTeamInfo.category,
    members: [myInfo]  // ✅ 팀장 내 정보 자동 추가!
  };

  dummyTeams.push(t);
  setSelectedTeam(t);
};
  const handleApply = (team) => {
  setApplicationMap(prev => {
    const updated = { ...prev };
    if (!updated[team.id]) updated[team.id] = [];
    if (!updated[team.id].some(u => u.id === myProfile.id)) {
      updated[team.id].push(myProfile);
    }
    return updated;
  });
};
//팀원 등록
  const handleApplyMember = () => {
  const { skills, mainRole, subRole, intro, keywords } = myProfile;

  if (
    skills.length === 0 ||
    !mainRole.trim() ||
    !subRole.trim() ||
    !intro.trim() ||
    keywords.length === 0
  ) {
    toast.warning("모든 항목을 입력해주세요!");
    return;
  }

  setMemberRegistered(true); // 모든 입력 완료 시만 등록 진행
};

  const handleInvite = (targetUser) => {
  toast.success('초대가 완료되었습니다! 팀원의 수락을 기다려주세요.');
  setInviteMap(prev => {
    const updated = { ...prev };
    if (!updated[targetUser.id]) updated[targetUser.id] = [];

    // 중복 초대 방지
    const alreadyInvited = updated[targetUser.id].some(t => t.id === selectedTeam.id);
    if (!alreadyInvited) {
      updated[targetUser.id].push({
        id: selectedTeam.id,
        leader: myProfile.name,
        team: selectedTeam,
        user: targetUser
      });
    }

    return updated;
  });

  // 👇 초대한 사람 로그 추가
  setSentInvites(prev => {
    const exists = prev.some(u => u.id === targetUser.id);
    return exists ? prev : [...prev, targetUser];
  });
};

  const handleBack = () => {
    setUserType(null);
    setMemberRegistered(false);
    setSelectedTeam(null);
  };
  const handleApplyToTeam = (team) => {
  toast.success('신청이 완료되었습니다! 팀장의 수락을 기다려주세요.');
  setSentApplications(prev => [...prev, team]);
  setApplicationMap(prev => {
  const updated = { ...prev };
  if (!updated[team.id]) updated[team.id] = [];
  if (!updated[team.id].some(u => u.id === myProfile.id)) {
    updated[team.id].push(myProfile);
  }
  return updated;
});
};
const handleAcceptInvite = (user, team) => {
  setSelectedTeam(team);
  setInviteMap(prev => {
    const updated = { ...prev };
    if (updated[user.id]) {
      updated[user.id] = updated[user.id].filter(t => t.id !== team.id);
    }
    return updated;
  });
};


const handleRejectInvite = (id) => {
  setInviteMap(prev => {
    const updated = { ...prev };
    if (updated[myProfile.id]) {
      updated[myProfile.id] = updated[myProfile.id].filter(t => t.id !== id);
    }
    return updated;
  });
};

const handleAcceptApplication = (team) => {
  setSelectedTeam(team);
  setUserType('member'); // 팀원 시점 전환
};

const handleRejectApplication = (name) => {
  setApplicationMap(prev => {
  const updated = { ...prev };
  if (updated[selectedTeam?.id]) {
    updated[selectedTeam.id] = updated[selectedTeam.id].filter(u => u.name !== name);
  }
  return updated;
});
};
const handleDummyApply = (user, team) => {
  setApplicationMap(prev => {
    const updated = { ...prev };
    if (!updated[team.id]) updated[team.id] = [];
    // 중복 방지
    if (!updated[team.id].some(u => u.id === user.id)) {
      updated[team.id].push(user);
    }
    return updated;
  });
};
const forceJoinAsMember = (team) => {
  setSelectedTeam(prev => {
    const updated = {
      ...prev,
      members: [...(prev?.members || []), myProfile]
    };
    return updated;
  });
  setUserType('member'); // 팀원 시점으로 전환
};


  const filteredApplicants = applicants.filter(u => {
    if (filter.role && !u.mainRole.includes(filter.role)) return false;
    if (filter.skill && !u.skills.includes(filter.skill)) return false;
    if (filter.minRating && u.rating < +filter.minRating) return false;
    return true;
  });

const renderTeamSlots = (team) => {
  return team.members.map((member, idx) => (
    <div key={idx} className="team-member-card" style={{ width: '95%' }}>
      <p>👤 <strong>{member.name}</strong></p>
      <p>기술 스택 : {member.skills.join(', ')}</p>
      <p>희망 역할군 : {member.mainRole || '-'}</p>
      <p>보조 가능 역할군 : {member.subRole || '-'}</p>
      <p>보유 역량 : {member.keywords.join(', ')}</p>
      <p>⭐ {member.rating?.toFixed(1) || '4.8'} 참여 {member.participation || 2}회</p>
    </div>
  ));
};


  const PopularStats = () => {
    const roleCounts = {};
    dummyUsers.forEach(u => {
      const role = u.mainRole?.trim();
      if (role) {
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      }
    });
      const entries = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
      const total = entries.reduce((sum, [, count]) => sum + count, 0);

      // 주요 역할군: 전체 기준 비율 ≥ 5%
      const threshold = 0.05;
      const major = entries.filter(([, count]) => count / total >= threshold);
      const etc = entries.filter(([, count]) => count / total < threshold);
      const etcCount = etc.reduce((sum, [, count]) => sum + count, 0);

      const recommendList = ['소프트웨어 마에스트로', '산학협력 프로젝트 챌린지', '네이버 해커톤', '삼성 주니어 SW 창작대회'];

    return (
      <div className="right-widget-section">
        <div className="widget-box">
          <h4>📊 대기자 역할군별 비율</h4>
            {major.map(([role, count]) => {
              const percent = ((count / total) * 100).toFixed(0); // 전체 기준
              return (
                <div key={role} className="role-bar-wrapper">
                  <div>{role}</div>
                  <div className="role-bar-container">
                    <div className="role-bar" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="role-percentage">{percent}%</div>
                </div>
              );
            })}

            {etcCount > 0 && (
              <div className="role-bar-wrapper">
                <div>기타</div>
                <div className="role-bar-container">
                  <div className="role-bar" style={{ width: `${((etcCount / total) * 100).toFixed(0)}%` }}></div>
                </div>
                <div className="role-percentage">{((etcCount / total) * 100).toFixed(0)}%</div>
              </div>
            )}
        </div>

        <div className="widget-box recommend-box">
          <h4>📌 추천 공모전</h4>
          <ul>
            {recommendList.map((r, i) => (
              <li key={i}>✅ {r}</li>
            ))}
          </ul>
        </div>
      </div>
    );
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

      <div className="matching-intro">
        <h1><span className="highlight">OpenTeamUp</span> - 자유롭게 팀 결성하기</h1>
        <p>원하는 팀장을 선택하거나, 나만의 팀을 만들어 자유롭게 팀원을 구성해보세요</p>
        {!userType ? (
          <div className="role-toggle">
            <button onClick={() => setUserType('leader')}>👩‍💼 팀장 시작</button>
            <button onClick={() => setUserType('member')}>👨‍👩‍👧‍👦 팀원 시작</button>
          </div>
        ) : (
          <button className="back-button" onClick={handleBack}>🔙 뒤로가기</button>
        )}
      </div>
      {!userType && (
        <div className="matching-desc">
          <img src={tupImg} alt="팀 매칭 설명" className="matching-image" />
          <p>팀장 또는 팀원이 되어 OpenTeamUP을 시작해보세요</p>
        </div>
)}

      
      <div className="main-content">
        <div className="left-pane">
          {userType === 'leader' && !selectedTeam && (
            <div className="team-create-form">
              <h3>팀 생성하기</h3>
              <input type="text" placeholder="모집 역할군" value={newTeamInfo.lookingFor} onChange={e => setNewTeamInfo({ ...newTeamInfo, lookingFor: e.target.value })} />
              <input type="text" placeholder="공모전 분야" value={newTeamInfo.category} onChange={e => setNewTeamInfo({ ...newTeamInfo, category: e.target.value })} />
              <input type="number" placeholder="모집 인원" value={newTeamInfo.maxMembers} onChange={e => setNewTeamInfo({ ...newTeamInfo, maxMembers: +e.target.value })} />
              <input type="text" placeholder="한 줄 소개" value={newTeamInfo.intro} onChange={e => setNewTeamInfo({ ...newTeamInfo, intro: e.target.value })} />
              <input type="text" placeholder="기술 스택" value={newTeamInfo.skills} onChange={e => setNewTeamInfo({ ...newTeamInfo, skills: e.target.value })} />
              <input type="text" placeholder="희망 역할군" value={myProfile.mainRole} onChange={e => setMyProfile({ ...myProfile, mainRole: e.target.value })}/>
              <input type="text" placeholder="보조 가능 역할군" value={myProfile.subRole} onChange={e => setMyProfile({ ...myProfile, subRole: e.target.value })}/>
              <div className="keyword-section">
                <p className="keyword-label">나의 역량 키워드 (최대 3개 선택)</p>
                <div className="keyword-list">
                  {allSkills.map(kw => (
                    <button
                      key={kw}
                      type="button"
                      className={`keyword-btn ${myProfile.keywords.includes(kw) ? 'selected' : ''}`}
                      onClick={() => toggleKeyword(kw)}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
              <button className="cta-button" onClick={handleCreateTeam}>Save!</button>
            </div>
          )}

          {userType === 'member' && !memberRegistered && (
            <div className="team-create-form">
              <h3>팀원 등록하기</h3>
              <input type="text" placeholder="기술 스택" value={myProfile.skills.join(',')} onChange={e => setMyProfile({ ...myProfile, skills: e.target.value.split(',') })} />
              <input type="text" placeholder="희망 역할군" value={myProfile.mainRole} onChange={e => setMyProfile({ ...myProfile, mainRole: e.target.value })} />
              <input type="text" placeholder="보조 가능 역할군" value={myProfile.subRole} onChange={e => setMyProfile({ ...myProfile, subRole: e.target.value })} />
              <input type="text" placeholder="한 줄 소개" value={myProfile.intro} onChange={e => setMyProfile({ ...myProfile, intro: e.target.value })} />
              <div className="keyword-section">
                <p className="keyword-label">보유 역량 (최대 3개)</p>
                <div className="keyword-list">
                  {allSkills.map((kw) => {
                    const selectedKeywords = myProfile.keywords || [];
                    const isSelected = selectedKeywords.includes(kw);

                    return (
                      <button
                        key={kw}
                        type="button"
                        className={`keyword-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            // 키워드 제거
                            setMyProfile(prev => ({
                              ...prev,
                              keywords: selectedKeywords.filter(k => k !== kw)
                            }));
                          } else {
                            if (selectedKeywords.length >= 3) {
                              // ✅ 알림 확실히 호출
                              setTimeout(() => {
                                alert("역량 키워드는 최대 3개까지 선택할 수 있어요!");
                              }, 10);
                              return;
                            }

                            // 키워드 추가
                            setMyProfile(prev => ({
                              ...prev,
                              keywords: [...selectedKeywords, kw]
                            }));
                          }
                        }}
                      >
                        {kw}
                      </button>
                    );
                  })}
                </div>


              </div>
              <button className="cta-button" onClick={handleApplyMember}>Save!</button>
            </div>
          )}

          {userType === 'member' && memberRegistered && !selectedTeam && (
            <><div className="log-section">

            </div>
            <div className="list-scroll">
                {dummyTeams.map(team => {
  const isAppliedTeam = sentApplications.some(t => t.id === team.id); // ✅ 내가 신청한 팀인지 확인
        return (
          <div key={team.id} className="room-card">
            <h4>{team.leader}님의 팀</h4>
            <p>모집 역할군 : {team.lookingFor.join(', ')}</p>
            <p>공모전 분야 : {team.category || '미지정'}</p>          
            <p>한 줄 소개 : {team.intro}</p>

            {(() => {
              const isOverridden = team.id === 3;
              const currentMembers = isOverridden ? 5 : team.members.length;
              const maxMembers = isOverridden ? 5 : team.maxMembers;
              const isFull = currentMembers >= maxMembers;
              const statusText = isFull ? "모집완료" : "모집중";

              return (
                <>
                  <p>모집 인원 : <strong>{currentMembers} / {maxMembers}</strong></p>
                  <div className="status-and-button">
                    <span className={`status-badge ${isFull ? 'closed' : 'open'}`}>
                      {statusText}
                    </span>
                  </div>
                  <br />
                </>
              );
            })()}

            <button className="cta-button" onClick={() => handleApplyToTeam(team)}>
              신청하기
            </button>

            {isAppliedTeam && (
              <button
                className="sim-accept-button"
                onClick={() => handleSimulateAccept(team)}
              >
                시연용 수락버튼
              </button>
            )}
          </div>
        );
  })}
  </div></>
  )}

          {(userType === 'leader' && selectedTeam) || (userType === 'member' && selectedTeam) ? (
            <div className="my-team-info">
              <h3>{userType === 'leader' ? '내 팀 정보' : '신청한 팀 정보'}</h3>
              <div className="team-detail-box">
                <p><strong>모집 역할군 : </strong> {selectedTeam.lookingFor.join(', ')}</p>
                <p><strong>공모전 분야 : </strong> {selectedTeam.category || '미지정'}</p>
                <p><strong>모집 인원 : </strong> {selectedTeam.members.length} / {selectedTeam.maxMembers}</p>
                <p><strong>한 줄 소개 : </strong> {selectedTeam.intro}</p>
              </div>
              <h4>팀원 현황</h4>
              <div className="team-member-list">
                {renderTeamSlots(selectedTeam)}
              </div>
              {userType === 'leader' && (
              <div className="log-box">
                <h4>📤 초대한 사람 목록</h4>
                {sentInvites.length === 0 ? <p>초대한 사람이 없습니다.</p> : sentInvites.map(u => (
                <div key={u.id} className="log-entry">{u.name} 님에게 초대함</div>
                ))}
               </div>
               )}
               {userType === 'leader' && (
               <div className="log-box">
                  <h4>📥 신청자 목록</h4>
                  {receivedApplications.length === 0 ? <p>신청자가 없습니다.</p> : receivedApplications.map(u => (
                  <div key={u.name} className="log-entry">
                  {u.name} 님의 신청
                  <div className="button-group">
                    <div className="button-group">
                      <button onClick={() => forceAccept(u)}>수락</button>
                      <button onClick={() => handleRejectApplication(u.name)}>거절</button>
                      
                  </div>
                  </div>
                  </div>
            ))}
              </div>
               )}
            </div>
          ) : null}
        </div>

        <div className="right-pane">
  {/* 초기 상태: 팀 미선택 상태에서 PopularStats 표시 */}
  {(userType === 'leader' && !selectedTeam) || (userType === 'member' && !memberRegistered && !selectedTeam) ? (
    <PopularStats />
  ) : null}

  {/* 팀장 시점 + 팀 선택된 경우 → 필터/초대 UI 표시 */}
  {(userType === 'leader' && selectedTeam) && (
    <>
      <div className="filter-bar">
    <div className="filter-row">
    <select
      className="custom-select"
      value={filterMode}
      onChange={e => setFilterMode(e.target.value)}
    >
      <option value="skills">기술 필터</option>
      <option value="role">역할 필터</option>
    </select>

    {/* 항상 검색창 보이되 filterMode에 따라 placeholder 및 값/핸들러 변경 */}
    <input
      type="text"
      placeholder={filterMode === 'skills' ? '기술 입력' : '역할 입력'}
      value={filterMode === 'skills' ? filter.skills : filter.role}
      onChange={e =>
        setFilter({
          ...filter,
          [filterMode]: e.target.value,
        })
      }
    />
  </div>

  <div className="slider-container">
    <input
      type="range"
      min="0"
      max="5"
      step="0.1"
      value={filter.minRating}
      onChange={e => setFilter({ ...filter, minRating: e.target.value })}
    />
    <span>⭐ {filter.minRating}</span>
  </div>
</div>


      <h4>팀을 찾고 있는 사람</h4>
      <div className="list-scroll">
        {filteredApplicants.map(u => (
          <div key={u.id} className="applicant-card">
            <div><strong>{u.name}</strong></div>
            <div className="info-row"><strong>기술 스택 : </strong> {u.skills.join(', ')}</div>
            <div className="info-row"><strong>희망 역할군 :  {u.mainRole}</strong></div>
            <div className="info-row"><strong>보조 가능 역할군 : {u.subRole}</strong></div>
            <div className="info-row"><strong>보유 역량 :  {u.keywords.join(', ')}</strong></div>
            <div className="info-row"><strong>한 줄 소개 :  {u.intro}</strong></div>
            <div className="info-row">
              <p>⭐ {u.rating?.toFixed(1) || '-'} 참여 {u.participation || 0}회</p>
            </div>
            <button className="invite-btn" onClick={() => handleInvite(u)}>초대하기</button>
            <button className="sample-button" onClick={() => handleDummyApply(u, selectedTeam)}>내 팀으로 신청</button>
          </div>
        ))}
      </div>
    </>
  )}

  {/* 팀원 시점이고 팀에 이미 참여한 경우 → 공백 */}
  {(userType === 'member' && memberRegistered && selectedTeam) && (
    
  <></>
    
  )}

  {/* 팀원 시점이고 팀에 아직 참여하지 않음 → 내 정보 및 신청/초대 로그 */}
  {(userType === 'member' && memberRegistered ) && (
    <div className="my-info">
      <h4>내 정보</h4>
      <p><strong>이름 : {myProfile.name}</strong> </p>
      <p><strong>기술 스택 : {myProfile.skills.join(', ')}</strong> </p>
      <p><strong>희망 역할군 : {myProfile.mainRole}</strong></p>
      <p><strong>보조 가능 역할군 : {myProfile.subRole}</strong></p>
      <p><strong>보유 역량 : {myProfile.keywords.join(', ')}</strong> </p>
      <p><strong>한 줄 소개 :  {myProfile.intro}</strong></p>

      <div className="log-box">
        <h4>📤 신청한 팀</h4>
        {sentApplications.length === 0 ? <p>신청한 팀이 없습니다.</p> : sentApplications.map(t => (
          <div key={t.id} className="log-entry">{t.leader}님의 팀에 신청함</div>
        ))}
      </div>

      <div className="log-box">
        <h4>📥 받은 초대</h4>
        {receivedInvites.map(t => (
        <div key={t.id} className="log-entry">
        {t.leader}님의 초대
        <div className="button-group">
          <button onClick={() => handleAcceptInvite(t.user, t.team)}>수락</button>
          <button onClick={() => handleRejectInvite(t.id)}>거절</button>
        </div>
      </div>
      ))}
      </div>
    </div>
  )}
</div>
      </div>
    </div>
  );
}

export default TeamMatching2;
