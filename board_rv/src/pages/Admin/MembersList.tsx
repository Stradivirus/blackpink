import React, { useEffect, useState } from "react";
import type { Member } from "../../types/users";
import { API_URLS } from "../../api/urls";
import UserList from "../../components/UserList";

const columns = [
  { label: "ID", render: (m: Member) => m.id, hidden: true },
  { label: "고객 ID", render: (m: Member) => m.userId },
  { label: "닉네임", render: (m: Member) => m.nickname },
  { label: "회사명", render: (m: Member) => m.company_name }, // 회사명 컬럼 추가
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

  return (
    <UserList
      title="고객 명단"
      columns={columns}
      data={members}
      setData={setMembers}
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