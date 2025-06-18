import * as React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const menuItems = [
  { label: "대시보드", path: "/admin" },
  { label: "신규 계정 발급", path: "/admin/invite" },
  { label: "고객 게시판", path: "/postpage" },
  // 필요시 메뉴 추가
];

const AdminLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div
      style={{
        width: "92vw",
        margin: "0 auto",
        minHeight: "80vh",
        display: "flex",
        padding: "2rem 0",
      }}
    >
      {/* 좌측 메뉴 */}
      <nav
        style={{
          flex: 2,
          borderRight: "1px solid #eee",
          padding: "2rem 1rem",
          minWidth: 120,
        }}
      >
        <ul style={{ listStyle: "none", padding: 0 }}>
          {menuItems.map((item) => (
            <li key={item.path} style={{ marginBottom: 20 }}>
              <Link
                to={item.path}
                style={{
                  color: location.pathname === item.path ? "#1976d2" : "#333",
                  fontWeight: location.pathname === item.path ? "bold" : "normal",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* 우측 컨텐츠 */}
      <section style={{ flex: 8, padding: "2rem" }}>
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;