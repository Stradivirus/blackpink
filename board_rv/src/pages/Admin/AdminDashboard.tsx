import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TeamGraphs from "../../components/Admin/TeamGraphs";
import GCIRankingPanel from "../../components/Admin/GCIRankingPanel";
import RiskyCountryMap from "../../components/Admin/RiskyCountryMap";
import type { GraphType } from "../../components/Admin/TeamGraphs";

const securityGraphTypes: GraphType[] = [
  { type: "threat", label: "위협 유형 분포" },
  { type: "risk", label: "위험 등급 분포" },
  { type: "threat_y", label: "연도별 침해 현황" },
  { type: "threat_m", label: "월별 침해 현황" },
];

const devGraphTypes: GraphType[] = [
  // 예시: { type: "dev_graph1", label: "개발팀 그래프1" }
];
const bizGraphTypes: GraphType[] = [
  // 예시: { type: "biz_graph1", label: "사업팀 그래프1" }
];

const teamList = [
  { key: "dashboard", label: "대시보드" },
  { key: "security", label: "보안팀" },
  { key: "dev", label: "개발팀" },
  { key: "biz", label: "사업팀" },
];

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const selectedTeam = params.get("team") || "dashboard"; // 기본값: 대시보드

  // 잘못된 팀 값이면 아무것도 선택하지 않음(리다이렉트 없음)
  React.useEffect(() => {
    if (selectedTeam && !teamList.some((t) => t.key === selectedTeam)) {
      navigate("/admin", { replace: true });
    }
    // eslint-disable-next-line
  }, [selectedTeam]);

  let graphTypes: GraphType[] = [];
  if (selectedTeam === "security") graphTypes = securityGraphTypes;
  else if (selectedTeam === "dev") graphTypes = devGraphTypes;
  else if (selectedTeam === "biz") graphTypes = bizGraphTypes;

  return (
    <div>
      {/* 팀 선택 버튼 */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        {teamList.map((team) => (
          <button
            key={team.key}
            onClick={() => navigate(`/admin?team=${team.key}`)}
            style={{
              fontWeight: selectedTeam === team.key ? "bold" : "normal",
              borderBottom: selectedTeam === team.key ? "2px solid #333" : "none",
              background: "none",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              padding: 8,
            }}
          >
            {team.label}
          </button>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 48 }}>
        {selectedTeam === "dashboard" && (
          <div style={{ display: "flex", gap: 24, justifyContent: "center", margin: "32px 0" }}>
            <GCIRankingPanel />
            <RiskyCountryMap />
          </div>
        )}
        {selectedTeam === "security" && (
          <TeamGraphs graphTypes={securityGraphTypes} />
        )}
        {/* 개발팀, 사업팀 등도 필요시 추가 */}
      </div>
    </div>
  );
};

export default AdminDashboard;