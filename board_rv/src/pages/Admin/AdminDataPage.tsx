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

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>Incident 데이터</h2>
      <table border={1} cellPadding={4} style={{ width: "100%", marginTop: 16 }}>
        <thead>
          <tr>
            <th>incident_no</th>
            <th>company_id</th>
            <th>threat_type</th>
            <th>risk_level</th>
            <th>server_type</th>
            <th>incident_date</th>
            <th>status</th>
            <th>action</th>
            <th>handler_count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.incident_no}>
              <td>{row.incident_no}</td>
              <td>{row.company_id}</td>
              <td>{row.threat_type}</td>
              <td>{row.risk_level}</td>
              <td>{row.server_type}</td>
              <td>{row.incident_date}</td>
              <td>{row.status}</td>
              <td>{row.action}</td>
              <td>{row.handler_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDataPage;