import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TeamGraphs from "../../components/Admin/TeamGraphs";
import type { GraphType } from "../../components/Admin/TeamGraphs";

const securityGraphTypes: GraphType[] = [
  { type: "threat", label: "위협 유형 분포" },
  { type: "risk", label: "위험 등급 분포" },
  { type: "threat_y", label: "연도별 침해 현황" },
  { type: "threat_m", label: "월별 침해 현황" },
];

// 개발팀, 사업팀 그래프 타입도 필요시 추가
const devGraphTypes: GraphType[] = [
  // 예시: { type: "dev_graph1", label: "개발팀 그래프1" }
];
const bizGraphTypes: GraphType[] = [
  // 예시: { type: "biz_graph1", label: "사업팀 그래프1" }
];

const teamList = [
  { key: "security", label: "보안팀" },
  { key: "dev", label: "개발팀" },
  { key: "biz", label: "사업팀" },
];

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const selectedTeam = params.get("team") || "security"; // 기본값: 보안팀

  // 팀이 잘못된 값이면 보안팀으로 리다이렉트
  React.useEffect(() => {
    if (!teamList.some((t) => t.key === selectedTeam)) {
      navigate("/admin?team=security", { replace: true });
    }
    // eslint-disable-next-line
  }, [selectedTeam]);

  let graphTypes: GraphType[] = [];
  if (selectedTeam === "security") graphTypes = securityGraphTypes;
  else if (selectedTeam === "dev") graphTypes = devGraphTypes;
  else if (selectedTeam === "biz") graphTypes = bizGraphTypes;

  return (
    <div style={{ textAlign: "center" }}>
      <h1>관리자 대시보드</h1>
      <p>이곳은 관리자만 접근 가능한 페이지입니다.</p>
      <div style={{ marginTop: 32 }}>
        <h3>기본 정보</h3>
        <ul style={{ display: "inline-block", textAlign: "left" }}>
          {/* 실제 데이터로 교체 가능 */}
        </ul>
      </div>
      <div style={{ marginTop: 48 }}>
        <h2>{teamList.find((t) => t.key === selectedTeam)?.label} 통계</h2>
        {graphTypes.length > 0 ? (
          <TeamGraphs graphTypes={graphTypes} />
        ) : (
          <div style={{ color: "#888", marginTop: 32 }}>
            {teamList.find((t) => t.key === selectedTeam)?.label} 관련 내용
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;