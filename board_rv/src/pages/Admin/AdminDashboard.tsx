import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TeamGraphs from "../../components/Admin/TeamGraphs";
import type { GraphType } from "../../components/Admin/TeamGraphs";
import "../../styles/admindashboard.css";

const securityGraphTypes: GraphType[] = [
  { type: "threat", label: "위협 유형 분포" },
  { type: "risk", label: "위험 등급 비율" },
  { type: "threat_y", label: "연도별 침해 현황" },
  // { type: "threat_m", label: "월별 침해 현황(상위 5개)" },
  { type: "processed_threats", label: "처리된 위협 종류" },
  { type: "correl_threats_server", label: "서버별 위협 발생(Heatmap)" },
  { type: "correl_risk_status", label: "위협 등급별 처리 현황" },
  { type: "correl_threat_action", label: "위협 유형과 조치 방법" },
  { type: "correl_threat_handler", label: "위협 유형별 필요 인원" },
];

const teamList = [
  { key: "security", label: "보안팀" },
];

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const selectedTeam = params.get("team") || "security";

  React.useEffect(() => {
    if (selectedTeam && !teamList.some((t) => t.key === selectedTeam)) {
      navigate("/admin?team=security", { replace: true });
    }
  }, [selectedTeam, navigate]);

  let graphTypes: GraphType[] = [];
  if (selectedTeam === "security") graphTypes = securityGraphTypes;

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <h1>보안팀 대시보드</h1>
        <p>보안팀의 위협 현황 및 통계</p>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
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
        {selectedTeam === "security" && (
          <TeamGraphs graphTypes={securityGraphTypes} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;