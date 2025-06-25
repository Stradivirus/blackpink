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
  loading: boolean;
  accountType: "member" | "admin";
  onAfterNicknameUpdate?: (id: number, nickname: string) => void; // 상태 갱신용 콜백(선택)
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
};

function UserList<T extends { id: number; nickname: string }>({
  title,
  columns,
  data,
  loading,
  accountType,
  onAfterNicknameUpdate,
}: UserListProps<T>) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nicknameValue, setNicknameValue] = useState<string>("");

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

  const handleNicknameUpdate = async (id: number, nickname: string) => {
    const user = data.find(u => u.id === id);
    try {
      const res = await fetch(API_URLS.CHANGE_NICKNAME, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.userId, // userId로!
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

  // hidden이 true인 칼럼은 표시하지 않음
  const visibleColumns = columns.filter(col => !col.hidden);

  return (
    <div style={styles.card}>
      <div style={styles.title}>{title}</div>
      {loading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : data.length === 0 ? (
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
              {data.map((row, idx) => (
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