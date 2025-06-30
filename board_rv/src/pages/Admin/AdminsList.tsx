import React, { useState } from "react";
import type { Admin } from "../../types/users";
import { API_URLS } from "../../api/urls";
import UserList from "../../components/UserList";
import { teamLabelMap } from "../../constants/dataconfig";

// 팀 필터용 라벨
const teamLabels = Object.values(teamLabelMap);

// 관리자 테이블 컬럼 정의
const columns = [
  { label: "ID", render: (m: Admin) => m.id, hidden: true },
  { label: "관리자 ID", render: (m: Admin) => m.userId },
  { label: "이름", render: (m: Admin) => m.nickname },
  { label: "팀", render: (m: Admin) => m.team },
  { label: "전화번호", render: (m: Admin) => m.phone || "-" },
];

// 공통 데이터 fetch 훅 (리스트 데이터/로딩 관리)
function useUserListData<T>(url: string) {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [url]);

  return { data, setData, loading };
}

const AdminsList: React.FC = () => {
  // 관리자 데이터 및 로딩 상태 관리
  const { data: admins, setData: setAdmins, loading } = useUserListData<Admin>(API_URLS.ADMIN_LIST);
  const [selectedTeam, setSelectedTeam] = useState<string>("전체");

  // 팀 필터링
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
        {/* 팀 필터 버튼 */}
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
          // 닉네임 변경 후 상태 업데이트
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