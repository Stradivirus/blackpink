import React from "react";
import AuthForm from "../../components/AuthForm";

// 로그인 패널 props 타입 정의
interface LoginPanelProps {
  titleStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
  buttonHoverStyle: React.CSSProperties;
  hoveredBtn: string | null;
  setHoveredBtn: (btn: string | null) => void;
  setAuthMode: (mode: "login" | null) => void;
  setLoginError: (msg: string) => void;
  authMode: "login" | null;
  loginError: string;
  handleAdminAutoLogin: () => void;
  handleAuthSuccess: (user: any) => void;
  navigate: (path: string) => void;
  login: (token: string, user: any) => void;
}

// 로그인/게시판/자동로그인 버튼 및 AuthForm을 제공하는 패널
const LoginPanel: React.FC<LoginPanelProps> = ({
  titleStyle,
  buttonStyle,
  buttonHoverStyle,
  hoveredBtn,
  setHoveredBtn,
  setAuthMode,
  setLoginError,
  authMode,
  loginError,
  handleAdminAutoLogin,
  handleAuthSuccess,
  navigate,
  login,
}) => (
  <>
    <h1 style={titleStyle}>SECURITY BOARD</h1>
    <div
      style={{
        background: "rgba(30, 40, 55, 0.95)",
        borderRadius: "12px",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.7)",
        padding: "2rem 3rem",
        minWidth: "350px",
        border: "1.5px solid #00ffe7",
        marginBottom: "2rem",
      }}
    >
      <p
        style={{
          color: "#fff",
          fontSize: "1.2rem",
          marginBottom: "1.5rem",
        }}
      >
        신뢰와 안전을 최우선으로 하는{" "}
        <span
          style={{
            color: "#00ffe7",
            fontWeight: "bold",
            textShadow: "0 0 8px #00ffe7",
          }}
        >
          BLACKPINK
        </span>
        에 오신 것을 환영합니다.
      </p>
      {/* 로그인 버튼 */}
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
      {/* 고객 게시판 버튼 */}
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
      {/* 관리자 자동 로그인 버튼 */}
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
        관리자 자동 로그인 (임시)
      </button>
      {/* 사용자 자동 로그인 버튼 */}
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
            const res = await fetch("/api/login", {
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
                {
                  id: data.id,
                  userId: data.userId,
                  nickname: data.nickname,
                  type: data.type,
                }
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
        사용자 자동 로그인 (임시)
      </button>
      {/* 로그인 폼 렌더링 */}
      {authMode === "login" && (
        <div style={{ margin: "2rem auto", maxWidth: 400 }}>
          <AuthForm onSuccess={handleAuthSuccess} />
        </div>
      )}
      {/* 에러 메시지 표시 */}
      {loginError && (
        <div
          style={{
            color: "red",
            marginTop: 12,
            textAlign: "center",
          }}
        >
          {loginError}
        </div>
      )}
    </div>
  </>
);

export default LoginPanel;