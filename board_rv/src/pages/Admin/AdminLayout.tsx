import * as React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ChangePasswordForm from "../../components/ChangePasswordForm";
import Modal from "../../components/Modal";
import { teamList, teamLabelMap } from "../../constants/dataconfig";

// 어드민 메뉴 항목 정의
const menuItems = [
  { label: "대시보드", path: "/admin", isParent: true, children: [] },
  { label: "데이터", path: "/admin/data", isParent: true, children: [] },
  { label: "신규 계정 발급", path: "/admin/invite", isParent: false },
  { label: "관리자 목록", path: "/admin/admins", isParent: false },
  { label: "가입된 사람 목록", path: "/admin/members", isParent: false },
  { label: "고객 게시판", path: "/postpage", isParent: false },
];

const AdminLayout: React.FC = () => {
  const location = useLocation(); // 현재 라우트 정보
  const navigate = useNavigate(); // 라우터 이동 함수
  const [dashboardOpen, setDashboardOpen] = React.useState(false); // 대시보드 아코디언 상태
  const [dataOpen, setDataOpen] = React.useState(false);           // 데이터 아코디언 상태
  const { user, logout } = useAuth();                              // 유저 정보, 로그아웃
  const [pwModalOpen, setPwModalOpen] = React.useState(false);     // 비밀번호 변경 모달

  // 팀명과 닉네임 표시용
  const teamName = user?.team ? teamLabelMap[user.team] || user.team : "";
  const nickname = user?.nickname || "";

  // 라우트 변경 시 아코디언 자동 열기
  React.useEffect(() => {
    if (location.pathname === "/admin") {
      setDashboardOpen(true);
    }
    if (location.pathname.startsWith("/admin/data")) {
      setDataOpen(true);
    }
  }, [location.pathname]);

  // 대시보드 아코디언 토글
  const handleDashboardClick = () => {
    setDashboardOpen((prev) => !prev);
  };

  // 데이터 아코디언 토글
  const handleDataClick = () => {
    setDataOpen((prev) => !prev);
  };

  // 팀 탭 클릭 시 이동
  const handleTeamClick = (menuPath: string, teamKey: string) => {
    navigate(`${menuPath}?team=${teamKey}`);
  };

  // 현재 팀 탭 활성화 여부
  const isTeamActive = (teamKey: string, menuBasePath: string) =>
    location.pathname === menuBasePath &&
    new URLSearchParams(location.search).get("team") === teamKey;

  return (
    <div
      style={{
        width: "92vw",
        margin: "0 auto",
        minHeight: "80vh",
        display: "flex",
        padding: "2rem 0",
      }}
    >
      {/* 좌측 메뉴 */}
      <nav
        style={{
          flex: 2,
          borderRight: "1px solid #eee",
          padding: "2rem 1rem",
          minWidth: 120,
        }}
      >
        {/* 상단: 팀명/닉네임/버튼 */}
        {user && (
          <div style={{ fontSize: 20, marginBottom: 28, fontWeight: "bold", color: "#1976d2" }}>
            <span>
              {teamName && `${teamName} | `}{nickname} 님
            </span>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button
                className="board-btn"
                style={{ fontSize: 15, padding: "4px 10px" }}
                onClick={() => setPwModalOpen(true)}
              >
                비밀번호 변경
              </button>
              <button
                className="board-btn"
                style={{ fontSize: 13, padding: "4px 10px" }}
                onClick={logout}
              >
                로그아웃
              </button>
            </div>
            {/* 비밀번호 변경 모달 */}
            <Modal open={pwModalOpen} onClose={() => setPwModalOpen(false)}>
              <ChangePasswordForm onSuccess={() => setPwModalOpen(false)} />
            </Modal>
          </div>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {/* 대시보드 메뉴 (아코디언) */}
          <li style={{ marginBottom: 20 }}>
            <div
              style={{
                color:
                  isTeamActive("dashboard", "/admin") ||
                  (location.pathname === "/admin" && !new URLSearchParams(location.search).get("team"))
                    ? "#1976d2"
                    : "#333",
                fontWeight:
                  isTeamActive("dashboard", "/admin") ||
                  (location.pathname === "/admin" && !new URLSearchParams(location.search).get("team"))
                    ? "bold"
                    : "normal",
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onClick={handleDashboardClick}
            >
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleTeamClick("/admin", "dashboard");
                }}
                style={{ flex: 1, cursor: "pointer" }}
              >
                대시보드
              </span>
              <span style={{ fontSize: 18 }}>{dashboardOpen ? "▲" : "▼"}</span>
            </div>
            {dashboardOpen && (
              <ul style={{ listStyle: "none", paddingLeft: 16, marginTop: 8 }}>
                {teamList
                  .filter((team) => team.key !== "dashboard")
                  .map((team) => (
                    <li key={`dashboard-${team.key}`} style={{ marginBottom: 10 }}>
                      <span
                        style={{
                          color: isTeamActive(team.key, "/admin") ? "#1976d2" : "#555",
                          fontWeight: isTeamActive(team.key, "/admin") ? "bold" : "normal",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTeamClick("/admin", team.key);
                        }}
                      >
                        {team.label}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </li>

          {/* 데이터 메뉴 (아코디언) */}
          <li style={{ marginBottom: 20 }}>
            <div
              style={{
                color: location.pathname.startsWith("/admin/data") ? "#1976d2" : "#333",
                fontWeight: location.pathname.startsWith("/admin/data") ? "bold" : "normal",
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onClick={handleDataClick}
            >
              <span>데이터 관리</span>
              <span style={{ fontSize: 18 }}>{dataOpen ? "▲" : "▼"}</span>
            </div>
            {dataOpen && (
              <ul style={{ listStyle: "none", paddingLeft: 16, marginTop: 8 }}>
                {teamList.map((team) => (
                  <li key={`data-${team.key}`} style={{ marginBottom: 10 }}>
                    <span
                      style={{
                        color: isTeamActive(team.key, "/admin/data") ? "#1976d2" : "#555",
                        fontWeight: isTeamActive(team.key, "/admin/data") ? "bold" : "normal",
                        cursor: "pointer",
                      }}
                      onClick={() => handleTeamClick("/admin/data", team.key)}
                    >
                      {team.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* 기타 메뉴 (신규 계정 발급, 관리자/멤버/게시판) */}
          {menuItems
            .filter((item) => !item.isParent)
            .map((item) => (
              <li key={item.path} style={{ marginBottom: 20 }}>
                <Link
                  to={item.path}
                  style={{
                    color: location.pathname === item.path ? "#1976d2" : "#333",
                    fontWeight: location.pathname === item.path ? "bold" : "normal",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
      {/* 우측 컨텐츠 영역 */}
      <section style={{ flex: 8, padding: "2rem" }}>
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;