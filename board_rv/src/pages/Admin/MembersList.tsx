import React, { useEffect, useState } from "react";
import type { Member } from "../../types/Member";
import { API_URLS } from "../../api/urls";

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
    <div>
      <h2>가입된 사람 목록</h2>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>ID</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>유저ID</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>닉네임</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>이메일</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>가입일</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{member.id}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{member.userId}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{member.nickname}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{member.email}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{member.joinedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MembersList;