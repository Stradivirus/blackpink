import React, { useEffect, useState } from "react";
import type { Member } from "../../types/users";
import { API_URLS } from "../../api/urls";
import UserList from "../../components/UserList";

// 고객 명단 테이블 컬럼 정의
const columns = [
  { label: "ID", render: (m: Member) => m.id, hidden: true },
  { label: "고객 ID", render: (m: Member) => m.userId },
  { label: "닉네임", render: (m: Member) => m.nickname },
  { label: "회사명", render: (m: Member) => m.company_name },
  { label: "이메일", render: (m: Member) => m.email },
  { label: "가입일", render: (m: Member) => m.joinedAt },
];

// 공통 데이터 fetch 훅 (리스트 데이터/로딩 관리)
function useUserListData<T>(url: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

const MembersList: React.FC = () => {
  // 고객 데이터 및 로딩 상태 관리
  const { data: members, setData: setMembers, loading } = useUserListData<Member>(API_URLS.MEMBER_LIST);

  return (
    <UserList
      title="고객 명단"
      columns={columns}
      data={members}
      setData={setMembers}
      loading={loading}
      accountType="member"
      // 닉네임 변경 후 상태 업데이트
      onAfterNicknameUpdate={(id, nickname) =>
        setMembers((members) =>
          members.map((m) => (m.id === id ? { ...m, nickname } : m))
        )
      }
    />
  );
};

export default MembersList;