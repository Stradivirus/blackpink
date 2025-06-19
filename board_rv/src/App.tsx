import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import BoardHeader from "./components/CustomerBoard/BoardHeader";
import Home from "./pages/Home";
import PostPage from "./pages/CustomerBoard/PostPage";
import PostNewPage from "./pages/CustomerBoard/PostNewPage";
import PostForm from "./components/CustomerBoard/PostForm";
import { AuthProvider } from "./context/AuthContext";
import PostList from "./components/CustomerBoard/PostList"; 
import AdminDashboard from "./pages/Admin/AdminDashboard";
import MemberInvitePage from "./pages/Admin/MemberInvitePage";
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDataPage from "./pages/Admin/AdminDataPage";

const AppContent: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      {!isHome && !isAdmin && <BoardHeader />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/postpage" element={<PostList />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/posts/:id/edit" element={<PostForm isEdit={true} />} />
          <Route path="/new" element={<PostNewPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="invite" element={<MemberInvitePage />} />
            <Route path="data" element={<AdminDataPage />} />
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