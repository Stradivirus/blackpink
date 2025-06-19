import React, { useEffect, useState } from "react";
import type { Incident } from "../../types/Incident";
import { API_URLS } from "../../api/urls"; // 수정

const AdminDataPage: React.FC = () => {
  const [data, setData] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URLS.INCIDENT) // 수정
      .then(res => res.json())
      .then(res => {
        setData(res.incidents || []);
        setLoading(false);
      });
  }, []);

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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDataPage;