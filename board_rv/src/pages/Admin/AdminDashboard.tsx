import React from "react";
import MemberInviteForm from "../../components/Admin/MemberInviteForm";

const AdminDashboard: React.FC = () => {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>관리자 대시보드</h1>
      <p>이곳은 관리자만 접근 가능한 페이지입니다.</p>
      <MemberInviteForm />
      <p>여기에 관리자용 게시판, 통계, 회원 관리 등 기능을 추가할 수 있습니다.</p>
    </div>
  );
};

export default AdminDashboard;