import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";

// 스타일 객체 정의
const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #101820 60%, #2d3a4a 100%)",
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
  const [authMode, setAuthMode] = useState<"login" | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

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
        {authMode === "login" && (
          <div style={{ margin: "2rem auto", maxWidth: 400 }}>
            <AuthForm onSuccess={handleAuthSuccess} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;