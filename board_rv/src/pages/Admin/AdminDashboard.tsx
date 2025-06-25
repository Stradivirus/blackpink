import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GCIRankingPanel from "../../components/Admin/GCIRankingPanel";
import RiskyCountryMap from "../../components/Admin/RiskyCountryMap";
import SecurityGraphs from "../../components/Admin/AdminDashBoard/SecurityGraphs";
import BusinessGraphs from "../../components/Admin/AdminDashBoard/BusinessGraphs";
import SysDevGraphs from "../../components/Admin/AdminDashBoard/SysDevGraphs";
import { teamList, securityGraphTypes } from "../../constants/dataconfig";
import { API_URLS } from "../../api/urls";
import "../../styles/admindashboard.css";

const DashboardMainPanels: React.FC = () => (
  <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 32 }}>
    <GCIRankingPanel />
    <RiskyCountryMap />
  </div>
);

const TeamInfoPanels: React.FC<{ summary: any }> = ({ summary }) => {
  // 보안팀 등급별 색상 매핑
  const securityColors: Record<string, string> = {
    LOW: "#3498db",
    MEDIUM: "#f1c40f",
    HIGH: "#e74c3c",
    미지정: "#764ba2"
  };

  // 보안팀 등급 정렬 순서
  const securityOrder = ["LOW", "MEDIUM", "HIGH", "미지정"];

  const planColors: Record<string, string> = {
    베이직: "#764ba2",
    엔터프라이즈: "#3498db",
    프로: "#e67e22",
    미지정: "#888"
  };

  const osColors: Record<string, string> = {
    Windows: "#3498db",
    Linux: "#27ae60",
    macOS: "#9b59b6",
    iOS: "#e67e22",
    Android: "#16a085",
    미지정: "#888"
  };

  return (
    <div className="team-info-panels">
      <div className="team-info-panel">
        <div className="team-info-title">가입자 수</div>
        <div className="team-info-value">
          {summary?.biz ? (Object.values(summary.biz) as number[]).reduce((a, b) => a + b, 0) : 0}
        </div>
        {summary?.biz && (
          <div style={{ fontSize: '0.95rem', marginTop: 8 }}>
            {Object.entries(summary.biz).map(([plan, cnt]: any) => (
              <div key={plan} style={{ color: planColors[plan] || "#764ba2" }}>
                {plan}: {cnt}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="team-info-panel">
        <div className="team-info-title">진행 중 프로젝트</div>
        <div className="team-info-value">{summary?.dev?.total ?? 0}</div>
        {summary?.dev?.os && (
          <div style={{ fontSize: '0.95rem', marginTop: 8 }}>
            {Object.entries(summary.dev.os).map(([os, cnt]: any) => (
              <div key={os} style={{ color: osColors[os] || "#764ba2" }}>
                {os}: {cnt}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 보안팀 패널은 기존과 동일 */}
      <div className="team-info-panel">
        <div className="team-info-title">보안사고</div>
        <div className="team-info-value">
          {summary?.security ? (Object.values(summary.security) as number[]).reduce((a, b) => a + b, 0) : 0}
        </div>
        {summary?.security && (
          <div style={{ fontSize: '0.95rem', marginTop: 8 }}>
            {securityOrder
              .filter(level => summary.security[level])
              .map(level => (
                <div key={level} style={{ color: securityColors[level] || "#764ba2" }}>
                  {level}: {summary.security[level]}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const selectedTeam = params.get("team") || "";
  const [showMainPanels, setShowMainPanels] = React.useState(selectedTeam === "");
  const [summary, setSummary] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setShowMainPanels(selectedTeam === "");
    if (selectedTeam && !teamList.some((t) => t.key === selectedTeam)) {
      navigate("/admin", { replace: true });
    }
  }, [selectedTeam, navigate]);

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
          <button
            className={showMainPanels ? "admin-team-tab admin-tab-selected" : "admin-team-tab"}
            onClick={() => navigate("/admin")}
            style={{ marginRight: 12 }}
          >
            대시보드
          </button>
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
        {showMainPanels && <DashboardMainPanels />}
        {/* 팀 정보 패널을 대시보드 메인 패널 아래에 배치 */}
        {showMainPanels && !loading && <TeamInfoPanels summary={summary} />}
        {showMainPanels && loading && <div style={{marginTop:32, fontSize:'1.2rem'}}>로딩중...</div>}
        {!showMainPanels && selectedTeam === "security" && <SecurityGraphs graphTypes={securityGraphTypes} />}
        {!showMainPanels && selectedTeam === "biz" && <BusinessGraphs />}
        {!showMainPanels && (selectedTeam === "dev" || selectedTeam === "sys_dev") && <SysDevGraphs />}
      </div>
    </div>
  );
};

export default AdminDashboard;