import React, { Suspense, lazy, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import BoardHeader from "./components/CustomerBoard/BoardHeader";
// 홈 페이지 컴포넌트
import Home from "./pages/Home";
// 게시판 상세/작성/수정/목록 컴포넌트
import PostPage from "./pages/CustomerBoard/PostPage";
import PostNewPage from "./pages/CustomerBoard/PostNewPage";
import PostForm from "./components/CustomerBoard/PostForm";
import PostList from "./components/CustomerBoard/PostList"; 
// 어드민 관련 컴포넌트
import { AuthProvider } from "./context/AuthContext";
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDataPage from "./pages/Admin/AdminDataPage";
import MembersList from "./pages/Admin/MembersList";
import AdminsList from "./pages/Admin/AdminsList";
import MemberInvitePage from "./pages/Admin/MemberInvitePage";

// AdminDashboard는 필요할 때만 불러오는 지연 로딩(lazy loading) 방식입니다.
// (앱 초기 로딩 속도 향상, 코드 분할)
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5분 비활동 시 자동 로그아웃

const AppContent: React.FC = () => {
  const location = useLocation(); // 현재 라우트 정보
  const isHome = location.pathname === "/"; // 홈 여부
  const isAdmin = location.pathname.startsWith("/admin"); // 어드민 여부
  const { isLoggedIn, logout } = useAuth(); // 인증 상태 및 로그아웃 함수
  const timerRef = useRef<number | null>(null); // 비활동 타이머 ref

  // 비활동 감지 및 자동 로그아웃
  useEffect(() => {
    if (!isLoggedIn) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout();
        alert("5분 동안 활동이 없어 자동 로그아웃되었습니다.");
      }, INACTIVITY_LIMIT);
    };

    // 사용자 활동 이벤트 등록
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    // 언마운트 시 이벤트 해제 및 타이머 정리
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoggedIn, logout]);

  return (
    <>
      {/* 홈/어드민이 아닐 때만 게시판 헤더 표시 */}
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
          </Route>
        </Routes>
      </main>
    </>
  );
};

// 인증 컨텍스트와 라우터로 앱 전체 감싸기
const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </AuthProvider>
);

export default App;