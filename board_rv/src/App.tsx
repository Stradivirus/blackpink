import React, { Suspense, lazy, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import BoardHeader from "./components/CustomerBoard/BoardHeader";
// 홈 페이지
import Home from "./pages/Home";
// 게시판 페이지
import PostPage from "./pages/CustomerBoard/PostPage";
import PostNewPage from "./pages/CustomerBoard/PostNewPage";
import PostForm from "./components/CustomerBoard/PostForm";
import PostList from "./components/CustomerBoard/PostList"; 
// 어드민 페이지
import { AuthProvider } from "./context/AuthContext";
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDataPage from "./pages/Admin/AdminDataPage";
import MembersList from "./pages/Admin/MembersList";
import AdminsList from "./pages/Admin/AdminsList";
import MemberInvitePage from "./pages/Admin/MemberInvitePage";
import BusinessGraphs from "./components/Admin/AdminDashBoard/BusinessGraphs";
import SysDevGraphs from "./components/Admin/AdminDashBoard/SysDevGraphs";

// AdminDashboard 컴포넌트는 지연로딩(lazy loading)으로 불러옵니다.
// 지연로딩이란, 애플리케이션에서 필요한 리소스(컴포넌트, 이미지, 데이터 등)를
// 처음부터 모두 불러오지 않고, 실제로 필요할 때(사용자가 해당 기능이나 페이지에 접근할 때)
// 동적으로 불러오는 기법입니다.
// React에서는 React.lazy와 Suspense를 사용해 컴포넌트 단위로 지연로딩을 구현할 수 있습니다.
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));

const INACTIVITY_LIMIT = 5 * 60 * 1000;

const AppContent: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isAdmin = location.pathname.startsWith("/admin");
  const { isLoggedIn, logout } = useAuth();
  const timerRef = useRef<number | null>(null);

  // 사용자 활동 감지 및 타이머 리셋
  useEffect(() => {
    if (!isLoggedIn) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout();
        alert("5분 동안 활동이 없어 자동 로그아웃되었습니다.");
      }, INACTIVITY_LIMIT);
    };

    // 활동 이벤트 종류
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoggedIn, logout]);

  return (
    <>
      {!isHome && !isAdmin && <BoardHeader />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/board" element={<PostList />} />
          <Route path="/postpage" element={<PostList />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/posts/:id/edit" element={<PostForm isEdit={true} />} />
          <Route path="/new" element={<PostNewPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route path="invite" element={<MemberInvitePage />} />
            <Route path="data" element={<AdminDataPage />} />
            <Route path="admins" element={<AdminsList />} />
            <Route path="members" element={<MembersList />} />
            <Route path="business-graphs" element={<BusinessGraphs />} />
            <Route path="sys-dev-graphs" element={<SysDevGraphs />} />
          </Route>
        </Routes>
      </main>
    </>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </AuthProvider>
);

export default App;