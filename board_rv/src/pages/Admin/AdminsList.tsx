import React, { useEffect, useState } from "react";
import type { Admin } from "../../types/Admin";
import { API_URLS } from "../../api/urls";

const teamLabels = ["관리팀", "보안팀", "사업팀", "개발팀"];

const AdminsList: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("전체");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URLS.ADMIN_LIST)
      .then((res) => res.json())
      .then((data) => {
        setAdmins(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredAdmins =
    selectedTeam === "전체"
      ? admins
      : admins.filter((admin) => admin.team === selectedTeam);

  return (
    <div>
      <h2>관리자 목록</h2>
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setSelectedTeam("전체")}
          style={{ marginRight: 8, fontWeight: selectedTeam === "전체" ? "bold" : "normal" }}
        >
          전체
        </button>
        {teamLabels.map((team) => (
          <button
            key={team}
            onClick={() => setSelectedTeam(team)}
            style={{ marginRight: 8, fontWeight: selectedTeam === team ? "bold" : "normal" }}
          >
            {team}
          </button>
        ))}
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>ID</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>유저ID</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>닉네임</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>팀</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => (
              <tr key={admin.id}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{admin.id}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{admin.userId}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{admin.nickname}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{admin.team}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminsList;