import { useState } from "react";
import axios from "axios";
import { API_URLS } from "../../api/urls";

const MemberInviteForm: React.FC = () => {
  const [userId, setUserId] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState<"member" | "admin">("member");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userIdError, setUserIdError] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const checkDuplicate = async (field: "userId" | "nickname", value: string) => {
    if (!value) return;
    try {
      const res = await axios.get(API_URLS.CHECK_DUPLICATE, {
        params: { field, value, accountType }
      });
      if (res.data.exists) {
        if (field === "userId") setUserIdError("이미 사용 중인 아이디입니다.");
        if (field === "nickname") setNicknameError("이미 사용 중인 닉네임입니다.");
      } else {
        if (field === "userId") setUserIdError(null);
        if (field === "nickname") setNicknameError(null);
      }
    } catch {
      // 에러 무시
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 1. 서버에 중복 체크 한 번 더
    try {
      const [userIdRes, nicknameRes] = await Promise.all([
        axios.get(API_URLS.CHECK_DUPLICATE, { params: { field: "userId", value: userId, accountType } }),
        axios.get(API_URLS.CHECK_DUPLICATE, { params: { field: "nickname", value: nickname, accountType } }),
      ]);
      if (userIdRes.data.exists) {
        setUserIdError("이미 사용 중인 아이디입니다.");
        setLoading(false);
        return;
      }
      if (nicknameRes.data.exists) {
        setNicknameError("이미 사용 중인 닉네임입니다.");
        setLoading(false);
        return;
      }
    } catch {
      // 에러 무시
    }

    // 2. 중복이 없으면 회원 초대 진행
    try {
      await axios.post(API_URLS.MEMBER_INVITE, {
        userId,
        nickname,
        email,
        accountType,
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
    <form onSubmit={handleSubmit} style={{ maxWidth: 300, margin: "2rem auto", padding: 30, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>신규 계정 발급</h2>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <label style={{ marginRight: 16 }}>
          <input
            type="radio"
            name="accountType"
            value="member"
            checked={accountType === "member"}
            onChange={() => setAccountType("member")}
          />
          일반 회원
        </label>
        <label>
          <input
            type="radio"
            name="accountType"
            value="admin"
            checked={accountType === "admin"}
            onChange={() => setAccountType("admin")}
          />
          관리자
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="아이디"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          onBlur={e => checkDuplicate("userId", e.target.value)}
          required
          style={{ width: "100%", padding: 8 }}
        />
        {userIdError && <div style={{ color: "red", fontSize: 12 }}>{userIdError}</div>}
      </div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="닉네임"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onBlur={e => checkDuplicate("nickname", e.target.value)}
          required
          style={{ width: "100%", padding: 8 }}
        />
        {nicknameError && <div style={{ color: "red", fontSize: 12 }}>{nicknameError}</div>}
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
      <button
        type="submit"
        disabled={loading || !!userIdError || !!nicknameError}
        style={{ width: "100%", padding: 10 }}
      >
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