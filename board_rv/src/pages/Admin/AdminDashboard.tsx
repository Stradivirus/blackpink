import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecurityGraphs from "../../components/Admin/AdminDashBoard/SecurityGraphs";
import BusinessGraphs from "../../components/Admin/AdminDashBoard/BusinessGraphs";
import SysDevGraphs from "../../components/Admin/AdminDashBoard/SysDevGraphs";
import DashboardSummaryGraphs, { TeamInfoPanels } from "../../components/Admin/AdminDashBoard/DashboardSummaryGraphs";
import { teamList, securityGraphTypes } from "../../constants/dataconfig";
import { API_URLS } from "../../api/urls";
import "../../styles/admindashboard.css";

const AdminDashboard: React.FC = () => {
  const location = useLocation(); // 라우트 정보
  const navigate = useNavigate(); // 라우터 이동 함수
  const params = new URLSearchParams(location.search);
  const selectedTeam = params.get("team") || ""; // 선택된 팀
  const [showMainPanels, setShowMainPanels] = React.useState(selectedTeam === ""); // 대시보드 메인 패널 표시 여부
  const [summary, setSummary] = React.useState<any>(null); // 대시보드 요약 데이터
  const [loading, setLoading] = React.useState(false);     // 로딩 상태

  // 팀 변경 시 메인 패널/잘못된 팀 처리
  React.useEffect(() => {
    setShowMainPanels(selectedTeam === "");
    if (selectedTeam && !teamList.some((t) => t.key === selectedTeam)) {
      navigate("/admin", { replace: true });
    }
  }, [selectedTeam, navigate]);

  // 대시보드 요약 데이터 fetch
  React.useEffect(() => {
    if (showMainPanels) {
      setLoading(true);
      fetch(API_URLS.DASHBOARD_SUMMARY)
        .then((res) => res.json())
        .then((data) => setSummary(data))
        .finally(() => setLoading(false));
    }
  }, [showMainPanels]);

  return (
    <div className={
      selectedTeam ? "admin-dashboard-container admin-team-dashboard" : "admin-dashboard-container"
    }>
      <div className="admin-dashboard-header">
        <div className="admin-team-tabs">
          {/* 대시보드 탭 */}
          <button
            className={showMainPanels ? "admin-team-tab admin-tab-selected" : "admin-team-tab"}
            onClick={() => navigate("/admin")}
            style={{ marginRight: 12 }}
          >
            대시보드
          </button>
          {/* 팀별 탭 */}
          {teamList.map((team) => (
            <button
              key={team.key}
              className={
                selectedTeam === team.key
                  ? "admin-team-tab admin-tab-selected"
                  : "admin-team-tab"
              }
              onClick={() => navigate(`/admin?team=${team.key}`)}
            >
              {team.label}
            </button>
          ))}
        </div>
      </div>
      <div className="admin-grid-layout" style={{ textAlign: "center", marginTop: 48 }}>
        {/* 대시보드 메인 패널/그래프/로딩 */}
        {showMainPanels && !loading && <TeamInfoPanels summary={summary} />}
        {showMainPanels && <DashboardSummaryGraphs />}
        {showMainPanels && loading && <div style={{marginTop:32, fontSize:'1.2rem'}}>로딩중...</div>}
        {/* 팀별 그래프 */}
        {!showMainPanels && selectedTeam === "security" && <SecurityGraphs graphTypes={securityGraphTypes} />}
        {!showMainPanels && selectedTeam === "biz" && <BusinessGraphs />}
        {!showMainPanels && (selectedTeam === "dev" || selectedTeam === "sys_dev") && <SysDevGraphs />}
      </div>
    </div>
  );
};

export default AdminDashboard;