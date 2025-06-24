import React, { useEffect, useState } from "react";
import type { Admin } from "../../types/Admin";
import { API_URLS } from "../../api/urls";

const teamLabels = ["관리팀", "보안팀", "사업팀", "개발팀"];

// 스타일 객체 추가
const styles = {
  card: {
    maxWidth: 900,
    margin: "3rem auto",
    padding: 32,
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 28,
    letterSpacing: -1,
    color: "#222",
    textAlign: "left" as const,
  },
  filterGroup: {
    marginBottom: 20,
    display: "flex",
    gap: 8,
  },
  filterBtn: (active: boolean) => ({
    padding: "7px 18px",
    borderRadius: 8,
    border: "none",
    background: active ? "#3b82f6" : "#f3f6fa",
    color: active ? "#fff" : "#222",
    fontWeight: active ? 700 : 500,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: active ? "0 2px 8px 0 rgba(59,130,246,0.08)" : undefined,
    transition: "background 0.2s, color 0.2s",
  }),
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 1px 4px 0 rgba(0,0,0,0.03)",
  },
  th: {
    background: "#f3f6fa",
    color: "#222",
    fontWeight: 600,
    fontSize: 16,
    padding: "14px 10px",
    borderBottom: "2px solid #e5e7eb",
    textAlign: "center" as const,
  },
  td: {
    padding: "12px 10px",
    borderBottom: "1px solid #f1f1f1",
    fontSize: 15,
    textAlign: "center" as const,
    color: "#333",
  },
  trHover: {
    background: "#f9fbfd",
    transition: "background 0.2s",
  },
  loading: {
    textAlign: "center" as const,
    color: "#3b82f6",
    fontSize: 18,
    padding: 40,
  },
};

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
    <div style={styles.card}>
      <div style={styles.title}>관리자 목록</div>
      <div style={styles.filterGroup}>
        <button
          onClick={() => setSelectedTeam("전체")}
          style={styles.filterBtn(selectedTeam === "전체")}
        >
          전체
        </button>
        {teamLabels.map((team) => (
          <button
            key={team}
            onClick={() => setSelectedTeam(team)}
            style={styles.filterBtn(selectedTeam === team)}
          >
            {team}
          </button>
        ))}
      </div>
      {loading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>유저ID</th>
              <th style={styles.th}>닉네임</th>
              <th style={styles.th}>팀</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin, idx) => (
              <tr
                key={admin.id}
                style={idx % 2 === 1 ? styles.trHover : undefined}
              >
                <td style={styles.td}>{admin.id}</td>
                <td style={styles.td}>{admin.userId}</td>
                <td style={styles.td}>{admin.nickname}</td>
                <td style={styles.td}>{admin.team}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminsList;