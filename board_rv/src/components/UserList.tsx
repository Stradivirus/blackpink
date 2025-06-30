import React, { useState } from "react";
import { API_URLS } from "../api/urls";
import styles from "./UserList.styles";

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