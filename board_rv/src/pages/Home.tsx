import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URLS } from "../api/urls";
import AuthForm from "../components/AuthForm";

// 스타일 객체 정의
const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg,rgb(16, 32, 24) 60%, #2d3a4a 100%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const titleStyle: React.CSSProperties = {
  color: "#00ffe7",
  fontSize: "3rem",
  fontWeight: "bold",
  letterSpacing: "2px",
  textShadow: "0 0 10px #00ffe7, 0 0 20px #0ff",
  marginBottom: "1.5rem",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(30, 40, 55, 0.95)",
  borderRadius: "12px",
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.7)",
  padding: "2rem 3rem",
  minWidth: "350px",
  border: "1.5px solid #00ffe7",
  marginBottom: "2rem",
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

  // 관리자 자동 로그인 처리
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

  const handleAuthSuccess = (user: any) => {
    setAuthMode(null);
    if (user.type === "admin") {
      navigate("/admin");
    } else {
      navigate("/postpage");
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>SECURE BOARD</h1>
      <div style={cardStyle}>
        <p style={{ color: "#fff", fontSize: "1.2rem", marginBottom: "1.5rem" }}>
          신뢰와 안전을 최우선으로 하는 보안 게시판에 오신 것을 환영합니다.
        </p>
        <button
          style={{
            ...buttonStyle,
            ...(hoveredBtn === "login" ? buttonHoverStyle : {}),
          }}
          onMouseEnter={() => setHoveredBtn("login")}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={() => setAuthMode("login")}
        >
          로그인
        </button>
        <button
          style={{
            ...buttonStyle,
            ...(hoveredBtn === "postpage" ? buttonHoverStyle : {}),
          }}
          onMouseEnter={() => setHoveredBtn("postpage")}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={() => navigate("/postpage")}
        >
          고객 게시판
        </button>
        {/* 아래에 관리자 자동 로그인 버튼 추가 */}
        <button
          style={{
            ...buttonStyle,
            background: "#222",
            color: "#00ffe7",
            border: "1.5px solid #00ffe7",
            marginTop: "1.5rem",
          }}
          onClick={handleAdminAutoLogin}
        >
          관리자 자동 로그인
        </button>
        {/* 사용자 자동 로그인 버튼 추가 */}
        <button
          style={{
            ...buttonStyle,
            background: "#222",
            color: "#00ffe7",
            border: "1.5px solid #00ffe7",
            marginTop: "0.7rem",
          }}
          onClick={async () => {
            setLoginError("");
            try {
              const res = await fetch(API_URLS.LOGIN, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: "test2", password: "12341234" }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.type !== "member") {
                  setLoginError("회원 계정이 아닙니다.");
                  return;
                }
                login(
                  data.token || "dummy-token",
                  { id: data.id, userId: data.userId, nickname: data.nickname, type: data.type }
                );
                navigate("/postpage");
              } else {
                setLoginError("사용자 로그인 실패");
              }
            } catch (err) {
              setLoginError("로그인 오류가 발생했습니다.");
            }
          }}
        >
          사용자 자동 로그인
        </button>
        {authMode === "login" && (
          <div style={{ margin: "2rem auto", maxWidth: 400 }}>
            <AuthForm onSuccess={handleAuthSuccess} />
          </div>
        )}
        {loginError && (
          <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>
            {loginError}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;