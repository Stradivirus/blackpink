import React, { useEffect, useState } from "react";
import type { Admin } from "../../types/users";
import { API_URLS } from "../../api/urls";
import UserList from "../../components/UserList";

const teamLabels = ["관리팀", "보안팀", "사업팀", "개발팀"];

const columns = [
  { label: "ID", render: (m: Admin) => m.id, hidden: true },
  { label: "관리자 ID", render: (m: Admin) => m.userId },
  { label: "이름", render: (m: Admin) => m.nickname },
  { label: "팀", render: (m: Admin) => m.team },
  { label: "전화번호", render: (m: Admin) => m.phone || "-" }, // 전화번호 컬럼 추가
];

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
      <div style={{ maxWidth: 900, margin: "3rem auto" }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 28,
            letterSpacing: -1,
            color: "#222",
            textAlign: "left",
          }}
        >
          관리자 목록
        </div>
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={() => setSelectedTeam("전체")}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: "none",
              background: selectedTeam === "전체" ? "#3b82f6" : "#f3f6fa",
              color: selectedTeam === "전체" ? "#fff" : "#222",
              fontWeight: selectedTeam === "전체" ? 700 : 500,
              fontSize: 15,
              cursor: "pointer",
              boxShadow:
                selectedTeam === "전체"
                  ? "0 2px 8px 0 rgba(59,130,246,0.08)"
                  : undefined,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            전체
          </button>
          {teamLabels.map((team) => (
            <button
              key={team}
              onClick={() => setSelectedTeam(team)}
              style={{
                padding: "7px 18px",
                borderRadius: 8,
                border: "none",
                background: selectedTeam === team ? "#3b82f6" : "#f3f6fa",
                color: selectedTeam === team ? "#fff" : "#222",
                fontWeight: selectedTeam === team ? 700 : 500,
                fontSize: 15,
                cursor: "pointer",
                boxShadow:
                  selectedTeam === team
                    ? "0 2px 8px 0 rgba(59,130,246,0.08)"
                    : undefined,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {team}
            </button>
          ))}
        </div>
        <UserList
          title="관리자 목록"
          columns={columns}
          data={filteredAdmins}
          loading={loading}
          accountType="admin"
          setData={setAdmins}
          onAfterNicknameUpdate={(id, nickname) =>
            setAdmins((admins) =>
              admins.map((a) => (a.id === id ? { ...a, nickname } : a))
            )
          }
        />
      </div>
    </div>
  );
};

export default AdminsList;