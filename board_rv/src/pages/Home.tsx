import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import AuthForm from "../components/AuthForm";

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #101820 60%, #2d3a4a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h1`
  color: #00ffe7;
  font-size: 3rem;
  font-weight: bold;
  letter-spacing: 2px;
  text-shadow: 0 0 10px #00ffe7, 0 0 20px #0ff;
  margin-bottom: 1.5rem;
`;

const Card = styled.div`
  background: rgba(30, 40, 55, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.7);
  padding: 2rem 3rem;
  min-width: 350px;
  border: 1.5px solid #00ffe7;
  margin-bottom: 2rem;
`;

export const Button = styled.button`
  width: 100%;
  background: #00ffe7;
  color: #101820;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  box-shadow: 0 0 8px #00ffe7;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: background 0.2s, color 0.2s;
  &:hover {
    background: #0ff;
    color: #222;
  }
`;

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
    <Container>
      <Title>SECURE BOARD</Title>
      <Card>
        <p style={{ color: "#fff", fontSize: "1.2rem", marginBottom: "1.5rem" }}>
          신뢰와 안전을 최우선으로 하는 보안 게시판에 오신 것을 환영합니다.
        </p>
        <Button onClick={() => setAuthMode("login")}>로그인</Button>
        <Button onClick={() => navigate("/postpage")}>고객 게시판</Button>
        {authMode === "login" && (
          <div style={{ margin: "2rem auto", maxWidth: 400 }}>
            <AuthForm onSuccess={handleAuthSuccess} />
          </div>
        )}
      </Card>
    </Container>
  );
};

export default Home;