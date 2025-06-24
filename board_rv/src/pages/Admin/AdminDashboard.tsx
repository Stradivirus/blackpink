import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TeamGraphs from "../../components/Admin/SecurityGraphs";
import GCIRankingPanel from "../../components/Admin/GCIRankingPanel";
import RiskyCountryMap from "../../components/Admin/RiskyCountryMap";
import BusinessGraphs from "../../components/Admin/BusinessGraphs";
import type { GraphType } from "../../components/Admin/SecurityGraphs";
import { teamList, securityGraphTypes } from "../../constants/dataconfig";
import "../../styles/admindashboard.css";

const EmptyTeamPage: React.FC<{ teamLabel: string }> = ({ teamLabel }) => (
  <div style={{ textAlign: "center", marginTop: 80 }}>
    <h2 style={{ color: "#888" }}>{teamLabel} 대시보드는 준비 중입니다.</h2>
  </div>
);

const DashboardMainPanels: React.FC = () => (
  <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 32 }}>
    <GCIRankingPanel />
    <RiskyCountryMap />
  </div>
);

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const selectedTeam = params.get("team") || "";
  const [showMainPanels, setShowMainPanels] = React.useState(selectedTeam === "");

  React.useEffect(() => {
    setShowMainPanels(selectedTeam === "");
    if (selectedTeam && !teamList.some((t) => t.key === selectedTeam)) {
      navigate("/admin", { replace: true });
    }
  }, [selectedTeam, navigate]);

  let graphTypes: GraphType[] = [];
  if (selectedTeam === "security") graphTypes = securityGraphTypes;
  // 사업팀 추가 (key: biz)
  if (selectedTeam === "biz") graphTypes = [];

  const selectedTeamLabel = teamList.find((t) => t.key === selectedTeam)?.label || "";

  return (
    <div className={
      selectedTeam ? "admin-dashboard-container admin-team-dashboard" : "admin-dashboard-container"
    }>
      <div className="admin-dashboard-header">
        <h1>관리자 대시보드</h1>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <button
          className={showMainPanels ? "admin-tab-selected" : "admin-tab"}
          onClick={() => navigate("/admin")}
        >
          대시보드
        </button>
        {teamList.map((team) => (
          <button
            key={team.key}
            className={selectedTeam === team.key ? "admin-tab-selected" : "admin-tab"}
            onClick={() => navigate(`/admin?team=${team.key}`)}
          >
            {team.label}
          </button>
        ))}
      </div>
      <div className="admin-grid-layout" style={{ textAlign: "center", marginTop: 48 }}>
        {showMainPanels && <DashboardMainPanels />}
        {!showMainPanels && selectedTeam === "security" && <TeamGraphs graphTypes={securityGraphTypes} />}
        {!showMainPanels && selectedTeam === "biz" && <BusinessGraphs />}
        {!showMainPanels && selectedTeam !== "security" && selectedTeam !== "biz" && <EmptyTeamPage teamLabel={selectedTeamLabel} />}
      </div>
    </div>
  );
};

export default AdminDashboard;