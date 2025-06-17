import React, { useState } from "react";
import axios from "axios";
import { API_URLS } from "../../api/urls";

const MemberInviteForm: React.FC = () => {
  const [userId, setUserId] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await axios.post(API_URLS.MEMBER_INVITE, {
        userId,
        nickname,
        email,
      });
      setMessage("임시 비밀번호가 이메일로 발송되었습니다.");
      setUserId("");
      setNickname("");
      setEmail("");
    } catch (err: any) {
      setMessage(
        err.response?.data?.detail || "회원 초대에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>회원 초대</h2>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="아이디"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          required
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="닉네임"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          required
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
        {loading ? "발송 중..." : "초대 메일 발송"}
      </button>
      {message && (
        <div style={{ marginTop: 16, color: message.includes("실패") ? "red" : "green" }}>
          {message}
        </div>
      )}
    </form>
  );
};

export default MemberInviteForm;