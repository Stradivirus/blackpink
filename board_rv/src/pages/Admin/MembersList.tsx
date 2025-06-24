import React, { useEffect, useState } from "react";
import type { Member } from "../../types/Member";
import { API_URLS } from "../../api/urls";

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

const MembersList: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URLS.MEMBER_LIST)
      .then((res) => res.json())
      .then((data) => {
        setMembers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={styles.card}>
      <div style={styles.title}>고객 명단</div>
      {loading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>고객 ID</th>
              <th style={styles.th}>닉네임</th>
              <th style={styles.th}>이메일</th>
              <th style={styles.th}>가입일</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, idx) => (
              <tr
                key={member.id}
                style={idx % 2 === 1 ? styles.trHover : undefined}
              >
                <td style={styles.td}>{member.id}</td>
                <td style={styles.td}>{member.userId}</td>
                <td style={styles.td}>{member.nickname}</td>
                <td style={styles.td}>{member.email}</td>
                <td style={styles.td}>{member.joinedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MembersList;