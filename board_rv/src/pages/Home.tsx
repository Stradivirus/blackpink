import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<"login" | null>(null);

  const handleAuthSuccess = (user: any) => {
    setAuthMode(null);
    if (user.type === "admin") {
      navigate("/admin");
    } else {
      navigate("/postpage");
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>보안회사에 오신 것을 환영합니다!</h1>
      <p>
        저희는 최신 IT 기술과 전문 인력을 바탕으로
        <br />
        기업과 개인의 소중한 정보를 안전하게 지키는
        <br />
        종합 보안 솔루션 기업입니다.
        <br />
        신뢰할 수 있는 보안 파트너,
        <br />
        여러분의 안전한 디지털 생활을 위해 항상 함께하겠습니다.
      </p>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setAuthMode("login")}>로그인</button>
        <button style={{ marginLeft: "1rem" }} onClick={() => navigate("/postpage")}>
          고객 게시판으로 이동
        </button>
      </div>
      {authMode === "login" && (
        <div style={{ margin: "2rem auto", maxWidth: 400 }}>
          <AuthForm onSuccess={handleAuthSuccess} />
        </div>
      )}
    </div>
  );
};

export default Home;