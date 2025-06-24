import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecurityGraphs from "../../components/Admin/AdminDashBoard/SecurityGraphs";
import GCIRankingPanel from "../../components/Admin/GCIRankingPanel";
import RiskyCountryMap from "../../components/Admin/RiskyCountryMap";
import BusinessGraphs from "../../components/Admin/AdminDashBoard/BusinessGraphs";
import SysDevGraphs from "../../components/Admin/AdminDashBoard/SysDevGraphs";
import type { GraphType } from "../../components/Admin/AdminDashBoard/SecurityGraphs";
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
  if (selectedTeam === "biz") graphTypes = [];

  const selectedTeamLabel = teamList.find((t) => t.key === selectedTeam)?.label || "";

  return (
    <div className={
      selectedTeam ? "admin-dashboard-container admin-team-dashboard" : "admin-dashboard-container"
    }>
      <div className="admin-dashboard-header">
        <h1>관리자 대시보드</h1>
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
        {!showMainPanels && selectedTeam === "security" && <SecurityGraphs graphTypes={securityGraphTypes} />}
        {!showMainPanels && selectedTeam === "biz" && <BusinessGraphs />}
        {!showMainPanels && selectedTeam === "sys_dev" && <SysDevGraphs />}
        {!showMainPanels && selectedTeam !== "security" && selectedTeam !== "biz" && selectedTeam !== "sys_dev" && <EmptyTeamPage teamLabel={selectedTeamLabel} />}
      </div>
    </div>
  );
};

export default AdminDashboard;