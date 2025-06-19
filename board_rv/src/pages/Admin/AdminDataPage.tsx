import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { API_URLS } from "../../api/urls";

// 팀 정의 (AdminLayout과 공유하는 경우 별도 파일로 분리하는 것이 더 좋음)
const teamList = [
  { key: "biz", label: "사업팀" },
  { key: "dev", label: "개발팀" },
  { key: "security", label: "보안팀" },
];

// 각 팀별 컬럼 정의 (렌더링용)
const columnsByTeam: Record<string, { key: string; label: string }[]> = {
  biz: [
    { key: "company_id", label: "Company ID" },
    { key: "company_name", label: "회사명" },
    { key: "industry", label: "업종" },
    { key: "plan", label: "플랜" },
    { key: "contract_start", label: "계약 시작일" },
    { key: "contract_end", label: "계약 종료일" },
    { key: "status", label: "상태" },
    { key: "manager_name", label: "담당자명" },
    { key: "manager_phone", label: "담당자 연락처" },
  ],
  dev: [
    { key: "company_id", label: "Company ID" },
    { key: "os", label: "OS" },
    { key: "os_version", label: "OS 버전" },
    { key: "dev_start_date", label: "개발 시작일" },
    { key: "dev_end_date", label: "개발 종료일" },
    { key: "progress", label: "진행 상태" },
    { key: "maintenance", label: "유지보수 여부" },
  ],
  security: [
    { key: "incident_no", label: "Incident No" },
    { key: "company_id", label: "Company ID" },
    { key: "threat_type", label: "위협 유형" },
    { key: "risk_level", label: "위험 등급" },
    { key: "server_type", label: "서버 종류" },
    { key: "incident_date", label: "사건 일자" },
    { key: "handled_date", label: "처리 일자" },
    { key: "status", label: "상태" },
    { key: "action", label: "조치" },
    { key: "handler_count", label: "처리 인원 수" },
  ],
};

const AdminDataPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  // AdminLayout에서 기본적으로 'security' 팀으로 넘겨주므로,
  // 여기서 기본값을 'biz'에서 'security'로 변경합니다.
  const selectedTeam = params.get("team") || "security";

  useEffect(() => {
    // AdminLayout에서 유효한 팀을 넘겨준다고 가정하지만,
    // 혹시 모를 직접 접근이나 잘못된 URL을 위해 유효성 검사 유지
    if (!teamList.some((t) => t.key === selectedTeam)) {
      // 유효하지 않은 팀이면 'security' 팀으로 리다이렉트
      navigate("/admin/data?team=security", { replace: true });
      return;
    }

    setLoading(true);

    let fetchUrl = "";
    switch (selectedTeam) {
      case "biz":
        fetchUrl = API_URLS.COMPANIES;
        break;
      case "dev":
        fetchUrl = API_URLS.DEV;
        break;
      case "security":
        fetchUrl = API_URLS.INCIDENT;
        break;
      default:
        // 이 경우까지 오는 일은 없겠지만, 만약을 위해 로딩 종료
        setLoading(false);
        return;
    }

    fetch(fetchUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((res) => {
        let result = [];

        // API 응답 구조에 따라 데이터 추출
        if (selectedTeam === "security") {
          result = res.incidents || [];
        } else if (selectedTeam === "biz") {
          result = res.companies || [];
        } else if (selectedTeam === "dev") {
          result = res.dev || [];
        }

        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error("데이터 로딩 중 오류 발생:", error);
        setData([]); // 에러 발생 시 데이터 초기화
        setLoading(false);
      });
  }, [selectedTeam, navigate]); // navigate도 의존성 배열에 추가

<<<<<<< HEAD
  // incidents를 incident_no 기준 내림차순 정렬
  const sortedIncidents = data.sort((a, b) => b.incident_no - a.incident_no);

  const getStatus = (incident) => {
    if (incident.handled_date) return "처리완료";
    const today = "2025-07-01";
    if (incident.incident_date <= today) return "진행중";
    return "예정";
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>Incident 데이터</h2>
      <table border={1} cellPadding={4} style={{ width: "100%", marginTop: 16 }}>
        <thead>
          <tr>
            <th>일련번호</th>
            <th>회사ID</th>
            <th>위협유형</th>
            <th>위험도</th>
            <th>서버유형</th>
            <th>사고일</th>
            <th>처리상태</th>
            <th>처리일</th>
            <th>handler_count</th>
          </tr>
        </thead>
        <tbody>
          {sortedIncidents.map((row) => (
            <tr key={row.incident_no}>
              <td>{row.incident_no}</td>
              <td>{row.company_id}</td>
              <td>{row.threat_type}</td>
              <td>{row.risk_level}</td>
              <td>{row.server_type}</td>
              <td>{row.incident_date}</td>
              <td>{getStatus(row)}</td>
              <td>
                {row.status === "처리완료" && row.handled_date
                  ? row.handled_date
                  : "미처리"}
              </td>
              <td>{row.handler_count}</td>
=======
  const columns = columnsByTeam[selectedTeam] || [];

  return (
    <div style={{ padding: "2rem" }}>
      <h1>데이터 관리</h1>

      {/* 상단 팀 선택 버튼은 AdminLayout의 좌측 메뉴로 대체되었으므로 제거됨 */}

      <h2>{teamList.find((t) => t.key === selectedTeam)?.label} 데이터</h2>

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table border={1} cellPadding={4} style={{ width: "100%", marginTop: 16 }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
>>>>>>> admin_dev
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? ( // 데이터가 있을 때만 렌더링
              data.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key}>{(row as any)[col.key]}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", padding: "20px" }}>
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDataPage;