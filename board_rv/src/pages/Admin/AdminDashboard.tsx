import * as React from "react";

const AdminDashboard: React.FC = () => (
  <div style={{ textAlign: "center" }}>
    <h1>관리자 대시보드</h1>
    <p>이곳은 관리자만 접근 가능한 페이지입니다.</p>
    {/* 여기에 기본 정보, 통계, 최근 활동 등 표시 */}
    <div style={{ marginTop: 32 }}>
      <h3>기본 정보</h3>
      <ul style={{ display: "inline-block", textAlign: "left" }}>
        {/* 실제 데이터로 교체 가능 */}
      </ul>
    </div>
  </div>
);

export default AdminDashboard;