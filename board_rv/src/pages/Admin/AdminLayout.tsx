import * as React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // 추가

const menuItems = [
  { label: "대시보드", path: "/admin" },
  { label: "데이터", path: "/admin/data" }, // 추가
  { label: "신규 계정 발급", path: "/admin/invite" },
  { label: "고객 게시판", path: "/postpage" },
];

const teamList = [
  { key: "security", label: "보안팀" },
  { key: "dev", label: "개발팀" },
  { key: "biz", label: "사업팀" },
];

const teamLabelMap: Record<string, string> = {
  "보안팀": "보안팀",
  "개발팀": "개발팀",
  "사업팀": "사업팀",
  "관리팀": "관리팀",
  // 필요시 추가
};

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboardOpen, setDashboardOpen] = React.useState(false);
  const { user } = useAuth(); // 추가

  // 팀명과 닉네임 표시용
  const teamName = user?.team ? teamLabelMap[user.team] || user.team : "";
  const nickname = user?.nickname || "";

  // 콘솔 출력 추가
  React.useEffect(() => {
    console.log("user:", user);
    console.log("teamName:", teamName);
  }, [user, teamName]);

  // 대시보드 탭이 활성화되면 자동으로 아코디언 펼침
  React.useEffect(() => {
    if (location.pathname === "/admin") setDashboardOpen(true);
  }, [location.pathname]);

  const handleDashboardClick = () => {
    setDashboardOpen((prev) => !prev);
  };

  const handleTeamClick = (teamKey: string) => {
    // 쿼리스트링으로 팀 정보 전달
    navigate(`/admin?team=${teamKey}`);
  };

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
        {/* 팀명 | 닉네임 표시 */}
        {user && (
          <div style={{ marginBottom: 28, fontWeight: "bold", color: "#1976d2" }}>
            {teamName && `${teamName} | `}{nickname} 님
          </div>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: 20 }}>
            <div
              style={{
                color: location.pathname === "/admin" ? "#1976d2" : "#333",
                fontWeight: location.pathname === "/admin" ? "bold" : "normal",
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onClick={handleDashboardClick}
            >
              <span>대시보드</span>
              <span style={{ fontSize: 18 }}>{dashboardOpen ? "▲" : "▼"}</span>
            </div>
            {dashboardOpen && (
              <ul style={{ listStyle: "none", paddingLeft: 16, marginTop: 8 }}>
                {teamList.map((team) => (
                  <li key={team.key} style={{ marginBottom: 10 }}>
                    <span
                      style={{
                        color:
                          location.pathname === "/admin" &&
                          new URLSearchParams(location.search).get("team") === team.key
                            ? "#1976d2"
                            : "#555",
                        fontWeight:
                          location.pathname === "/admin" &&
                          new URLSearchParams(location.search).get("team") === team.key
                            ? "bold"
                            : "normal",
                        cursor: "pointer",
                      }}
                      onClick={() => handleTeamClick(team.key)}
                    >
                      {team.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
          {menuItems.slice(1).map((item) => (
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
      {/* 우측 컨텐츠 */}
      <section style={{ flex: 8, padding: "2rem" }}>
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;