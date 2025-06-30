import React, { useState } from "react";
import { API_URLS } from "../api/urls";

type Column<T> = {
  label: string;
  render: (row: T) => React.ReactNode;
  hidden?: boolean; // 칼럼 숨김 여부 추가
};

interface UserListProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  setData: React.Dispatch<React.SetStateAction<T[]>>; // 추가
  loading: boolean;
  accountType: "member" | "admin";
  onAfterNicknameUpdate?: (id: string, nickname: string) => void;
  // onAfterDelete는 제거 (내부에서 직접 처리)
}

const styles = {
  card: {
    maxWidth: 900,
    margin: "3rem auto",
    padding: 32,
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    transition: "box-shadow 0.2s",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 28,
    letterSpacing: -1,
    color: "#222",
    textAlign: "left" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 1px 4px 0 rgba(0,0,0,0.03)",
    fontFamily: "inherit",
  },
  th: {
    background: "#f3f6fa",
    color: "#222",
    fontWeight: 600,
    fontSize: 16,
    padding: "14px 10px",
    borderBottom: "2px solid #e5e7eb",
    textAlign: "center" as const,
    letterSpacing: -0.5,
    userSelect: "none" as const,
  },
  td: {
    padding: "12px 10px",
    borderBottom: "1px solid #f1f1f1",
    fontSize: 15,
    textAlign: "center" as const,
    color: "#333",
    background: "#fff",
    transition: "background 0.2s",
    verticalAlign: "middle" as const,
    wordBreak: "break-all" as const,
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
  nickname: {
    color: "#2563eb",
    cursor: "pointer",
    textDecoration: "underline",
    fontWeight: 500,
    transition: "color 0.2s",
  },
  nicknameInput: {
    width: 120,
    fontSize: 15,
    padding: "4px 8px",
    border: "1px solid #bcd0ee",
    borderRadius: 6,
    outline: "none",
    background: "#f8fafc",
    color: "#222",
  },
  deleteBtn: {
    color: "#ef4444",
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    marginRight: 8,
  },
};

function UserList<T extends { id: string; nickname: string; userId?: string; company_name?: string }>(
  {
    title,
    columns,
    data,
    setData,
    loading,
    accountType,
    onAfterNicknameUpdate,
  }: UserListProps<T>
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nicknameValue, setNicknameValue] = useState<string>("");
  // 회사명 검색 상태 추가
  const [companySearch, setCompanySearch] = useState("");
  const [filteredData, setFilteredData] = useState<T[] | null>(null);

  // 회사명 검색 핸들러
  const handleCompanySearch = () => {
    if (!companySearch.trim()) {
      setFilteredData(null);
      return;
    }
    setFilteredData(
      data.filter(row =>
        row.company_name &&
        row.company_name.toLowerCase().includes(companySearch.trim().toLowerCase())
      )
    );
  };

  const handleNicknameClick = (row: T) => {
    setEditingId(row.id);
    setNicknameValue(row.nickname);
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNicknameValue(e.target.value);
  };

  const handleNicknameBlur = (row: T) => {
    if (nicknameValue !== row.nickname) {
      handleNicknameUpdate(row.id, nicknameValue);
    }
    setEditingId(null);
  };

  const handleNicknameUpdate = async (id: string, nickname: string) => {
    const user = data.find(u => u.id === id);
    try {
      const res = await fetch(API_URLS.CHANGE_NICKNAME, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.userId, // userId(로그인ID)로 전송
          new_nickname: nickname,
          accountType,
        }),
      });
      if (!res.ok) throw new Error("닉네임 변경 실패");
      if (onAfterNicknameUpdate) onAfterNicknameUpdate(id, nickname);
    } catch (e) {
      alert("닉네임 변경에 실패했습니다.");
    }
  };

  // 탈퇴(삭제) 처리 함수
  const handleDelete = async (row: T) => {
    if (!window.confirm("정말 탈퇴하시겠습니까?")) return;
    if (!row.userId || typeof row.userId !== "string") {
      alert("userId가 올바르지 않습니다.");
      return;
    }
    try {
      let res;
      if (accountType === "admin") {
        res = await fetch(API_URLS.ADMIN_DELETE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: row.userId }),
        });
      } else {
        res = await fetch(API_URLS.MEMBER_DELETE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: row.userId }),
        });
      }
      if (!res.ok) {
        alert("탈퇴에 실패했습니다.");
        return;
      }
      setData(prev => prev.filter(item => item.id !== row.id));
    } catch (e) {
      alert("네트워크 오류로 탈퇴에 실패했습니다.");
    }
  };

  // 닉네임 컬럼만 특별 처리
  const renderCell = (col: Column<T>, row: T) => {
    if (col.label === "닉네임") {
      if (editingId === row.id) {
        return (
          <input
            value={nicknameValue}
            autoFocus
            onChange={handleNicknameChange}
            onBlur={() => handleNicknameBlur(row)}
            onKeyDown={e => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            style={styles.nicknameInput}
          />
        );
      }
      return (
        <span
          style={styles.nickname}
          onClick={() => handleNicknameClick(row)}
        >
          {row.nickname}
        </span>
      );
    }
    return col.render(row);
  };

  // '탈퇴' 컬럼을 맨 뒤에 추가
  const columnsWithDelete: Column<T>[] = [
    ...columns, // 기존 컬럼 먼저
    {
      label: "탈퇴",
      render: (row: T) => (
        <button
          style={styles.deleteBtn}
          title="탈퇴"
          onClick={() => handleDelete(row)}
        >
          ×
        </button>
      ),
    },
  ];

  // hidden이 true인 칼럼은 표시하지 않음
  const visibleColumns = columnsWithDelete.filter(col => !col.hidden);

  return (
    <div style={styles.card}>
      {/* 타이틀 + 검색창 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={styles.title}>{title}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            placeholder="회사명 검색"
            value={companySearch}
            onChange={e => setCompanySearch(e.target.value)}
            style={{
              border: "1.5px solid #d0d7de",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 15,
              background: "#f8fafc",
              outline: "none",
            }}
            onKeyDown={e => { if (e.key === "Enter") handleCompanySearch(); }}
          />
          <button
            type="button"
            onClick={handleCompanySearch}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "7px 16px",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            검색
          </button>
        </div>
      </div>
      {/* 이하 기존 테이블 렌더링 */}
      {loading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : (filteredData ?? data).length === 0 ? (
        <div style={{ textAlign: "center", color: "#888", padding: 40 }}>
          데이터가 없습니다.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {visibleColumns.map((col, i) => (
                  <th key={i} style={styles.th}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(filteredData ?? data).map((row, idx) => (
                <tr key={row.id ?? idx} style={idx % 2 === 1 ? styles.trHover : undefined}>
                  {visibleColumns.map((col, i) => (
                    <td key={i} style={styles.td}>{renderCell(col, row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserList;