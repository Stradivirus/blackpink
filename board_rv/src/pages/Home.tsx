import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { API_URLS } from "../api/urls";
import NcsiDashboard from "../components/home/NcsiDashboard";
import LoginPanel from "../components/home/LoginPanel";

const titleStyle: React.CSSProperties = {
  color: "#00ffe7",
  fontSize: "3rem",
  fontWeight: "bold",
  letterSpacing: "2px",
  textShadow: "0 0 10px #00ffe7, 0 0 20px #0ff",
  marginBottom: "1.5rem",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  background: "#00ffe7",
  color: "#101820",
  fontWeight: "bold",
  border: "none",
  borderRadius: "6px",
  padding: "0.8rem 2rem",
  fontSize: "1.1rem",
  boxShadow: "0 0 8px #00ffe7",
  cursor: "pointer",
  marginBottom: "1rem",
  transition: "background 0.2s, color 0.2s",
};

const buttonHoverStyle: React.CSSProperties = {
  background: "#0ff",
  color: "#222",
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string>("");

  // 관리자 자동 로그인
  const handleAdminAutoLogin = async () => {
    setLoginError("");
    try {
      const res = await fetch(API_URLS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "admin", password: "1q2w3e4r" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.type !== "admin") {
          setLoginError("관리자 계정이 아닙니다.");
          return;
        }
        login(
          data.token || "dummy-token",
          { id: data.id, userId: data.userId, nickname: data.nickname, type: data.type }
        );
        navigate("/admin");
      } else {
        setLoginError("관리자 로그인 실패");
      }
    } catch (err) {
      setLoginError("로그인 오류가 발생했습니다.");
    }
  };

  // 로그인/회원가입 성공 시 이동
  const handleAuthSuccess = (user: any) => {
    setAuthMode(null);
    if (user.type === "admin") {
      navigate("/admin");
    } else {
      navigate("/postpage");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "row",
        background: "linear-gradient(135deg,rgb(16, 32, 24) 60%, #2d3a4a 100%)",
        boxSizing: "border-box",
        paddingLeft: "8vw",
        paddingRight: "8vw",
      }}
    >
      {/* 왼쪽: NCSI 대시보드 */}
      <div
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <NcsiDashboard />
      </div>
      {/* 오른쪽: 로그인/게시판 등 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoginPanel
          titleStyle={titleStyle}
          buttonStyle={buttonStyle}
          buttonHoverStyle={buttonHoverStyle}
          hoveredBtn={hoveredBtn}
          setHoveredBtn={setHoveredBtn}
          setAuthMode={setAuthMode}
          setLoginError={setLoginError}
          authMode={authMode}
          loginError={loginError}
          handleAdminAutoLogin={handleAdminAutoLogin}
          handleAuthSuccess={handleAuthSuccess}
          navigate={navigate}
          login={login}
        />
      </div>
    </div>
  );
};

export default Home;