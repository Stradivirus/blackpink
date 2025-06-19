import * as React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // 추가

const menuItems = [
  { label: "대시보드", path: "/admin", isParent: true, children: [] },
  { label: "데이터", path: "/admin/data", isParent: true, children: [] },
  { label: "신규 계정 발급", path: "/admin/invite", isParent: false },
  { label: "고객 게시판", path: "/postpage", isParent: false },
];

const teamList = [
  { key: "biz", label: "사업팀" }, // 사업팀으로 통일
  { key: "dev", label: "개발팀" },
  { key: "security", label: "보안팀" },
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
  const [dataOpen, setDataOpen] = React.useState(false);
  const { user } = useAuth(); // 추가

  // 팀명과 닉네임 표시용
  const teamName = user?.team ? teamLabelMap[user.team] || user.team : "";
  const nickname = user?.nickname || "";

  // 콘솔 출력 추가
  React.useEffect(() => {
    console.log("user:", user);
    console.log("teamName:", teamName);
  }, [user, teamName]);

  React.useEffect(() => {
    // 대시보드 탭이 활성화되면 자동으로 아코디언 펼침
    if (location.pathname === "/admin") {
      setDashboardOpen(true);
    }
    // 이전에 있던 else { setDashboardOpen(false); }는 제거됨

    // 데이터 탭이 활성화되면 자동으로 아코디언 펼침
    if (location.pathname.startsWith("/admin/data")) {
      setDataOpen(true);
    }
    // 이전에 있던 else { setDataOpen(false); }는 제거됨
  }, [location.pathname]);

  const handleDashboardClick = () => {
    setDashboardOpen((prev) => !prev);
    // 이전에 있던 if (!dashboardOpen) { ... navigate(...) ... } 블록은 제거됨
    // 이제 이 함수는 단순히 아코디언을 열고 닫는 역할만 함
  };

  const handleDataClick = () => {
    setDataOpen((prev) => !prev);
    // 이전에 있던 if (!dataOpen) { ... navigate(...) ... } 블록은 제거됨
    // 이제 이 함수는 단순히 아코디언을 열고 닫는 역할만 함
  };

  const handleTeamClick = (menuPath: string, teamKey: string) => {
    // 쿼리스트링으로 팀 정보 전달 (이 로직은 그대로 유지)
    navigate(`${menuPath}?team=${teamKey}`);
  };

  const isMenuItemActive = (path: string) => location.pathname === path;
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
        {/* 팀명 | 닉네임 표시 */}
        {user && (
          <div style={{ marginBottom: 28, fontWeight: "bold", color: "#1976d2" }}>
            {teamName && `${teamName} | `}{nickname} 님
          </div>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {/* 대시보드 메뉴 */}
          <li style={{ marginBottom: 20 }}>
            <div
              style={{
                color: isMenuItemActive("/admin") ? "#1976d2" : "#333",
                fontWeight: isMenuItemActive("/admin") ? "bold" : "normal",
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
                  <li key={`dashboard-${team.key}`} style={{ marginBottom: 10 }}>
                    <span
                      style={{
                        color: isTeamActive(team.key, "/admin") ? "#1976d2" : "#555",
                        fontWeight: isTeamActive(team.key, "/admin") ? "bold" : "normal",
                        cursor: "pointer",
                      }}
                      onClick={() => handleTeamClick("/admin", team.key)}
                    >
                      {team.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* 데이터 메뉴 (아코디언 형식) */}
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
              <span>데이터</span>
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

          {/* 나머지 메뉴 아이템 (신규 계정 발급, 고객 게시판) */}
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
      {/* 우측 컨텐츠 */}
      <section style={{ flex: 8, padding: "2rem" }}>
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;