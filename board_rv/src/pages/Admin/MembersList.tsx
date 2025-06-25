import React, { useEffect, useState } from "react";
import type { Member } from "../../types/Member";
import { API_URLS } from "../../api/urls";
import UserList from "../../components/UserList";

const columns = [
  { label: "ID", render: (m: Member) => m.id, hidden: true },
  { label: "고객 ID", render: (m: Member) => m.userId },
  { label: "닉네임", render: (m: Member) => m.nickname },
  { label: "이메일", render: (m: Member) => m.email },
  { label: "가입일", render: (m: Member) => m.joinedAt },
];

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

  const handleNicknameUpdate = async (id: number, nickname: string) => {
    try {
      const res = await fetch(API_URLS.CHANGE_NICKNAME, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: id, // 또는 userId 필드명에 맞게
          new_nickname: nickname,
          accountType: "member", // 또는 "admin"
        }),
      });
      if (!res.ok) throw new Error("닉네임 변경 실패");
      // 성공 시 프론트 상태도 갱신
      setMembers((members) =>
        members.map((m) => (m.id === id ? { ...m, nickname } : m))
      );
    } catch (e) {
      alert("닉네임 변경에 실패했습니다.");
    }
  };

  return (
    <UserList
      title="고객 명단"
      columns={columns}
      data={members}
      loading={loading}
      accountType="member"
      onAfterNicknameUpdate={(id, nickname) =>
        setMembers((members) =>
          members.map((m) => (m.id === id ? { ...m, nickname } : m))
        )
      }
    />
  );
};

export default MembersList;