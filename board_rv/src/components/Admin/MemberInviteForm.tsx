import { useState } from "react";
import axios from "axios";
import { API_URLS } from "../../api/urls";
import type { Admin } from "../../types/users";

const ADMIN_TEAMS: Admin["team"][] = ["관리팀", "보안팀", "사업팀", "개발팀"];

// 스타일 객체 추가
const styles = {
  card: {
    maxWidth: 360,
    margin: "3rem auto",
    padding: 36,
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
    letterSpacing: -1,
    color: "#222",
  },
  radioGroup: {
    display: "flex",
    justifyContent: "center",
    gap: 24,
    marginBottom: 20,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: 500,
    color: "#444",
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d7de",
    fontSize: 15,
    marginBottom: 12,
    background: "#f8fafc",
    outline: "none",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d7de",
    fontSize: 15,
    marginBottom: 12,
    background: "#f8fafc",
    outline: "none",
    transition: "border 0.2s",
  },
  inputError: {
    border: "1.5px solid #e74c3c",
    background: "#fff6f6",
  },
  error: {
    color: "#e74c3c",
    fontSize: 13,
    margin: "-8px 0 8px 2px",
    minHeight: 18,
  },
  button: {
    width: "100%",
    padding: "12px 0",
    borderRadius: 8,
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
    marginTop: 8,
    transition: "background 0.2s",
  },
  buttonDisabled: {
    background: "#b6c3d1",
    cursor: "not-allowed",
  },
  message: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: 500,
    textAlign: "center" as const,
  },
};

const MemberInviteForm: React.FC = () => {
  const [userId, setUserId] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState<"member" | "admin">("member");
  const [team, setTeam] = useState<Admin["team"]>("관리팀");
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
      const payload: any = {
        userId,
        nickname,
        email,
        accountType,
      };
      if (accountType === "admin") {
        payload.team = team;
      }
      await axios.post(API_URLS.MEMBER_INVITE, payload);
      setMessage("임시 비밀번호가 이메일로 발송되었습니다.");
      setUserId("");
      setNickname("");
      setEmail("");
      setTeam("관리팀");
    } catch (err: any) {
      setMessage(
        err.response?.data?.detail || "회원 초대에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      <div style={styles.title}>신규 계정 발급</div>
      <div style={styles.radioGroup}>
        <label style={styles.radioLabel}>
          <input
            type="radio"
            name="accountType"
            value="member"
            checked={accountType === "member"}
            onChange={() => setAccountType("member")}
            style={{ accentColor: "#3b82f6" }}
          />
          일반 회원
        </label>
        <label style={styles.radioLabel}>
          <input
            type="radio"
            name="accountType"
            value="admin"
            checked={accountType === "admin"}
            onChange={() => setAccountType("admin")}
            style={{ accentColor: "#3b82f6" }}
          />
          관리자
        </label>
      </div>
      {accountType === "admin" && (
        <select
          value={team}
          onChange={e => setTeam(e.target.value as Admin["team"])}
          style={styles.select}
          required
        >
          {ADMIN_TEAMS.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}
      <input
        type="text"
        placeholder="아이디"
        value={userId}
        onChange={e => setUserId(e.target.value)}
        onBlur={e => checkDuplicate("userId", e.target.value)}
        required
        style={userIdError ? { ...styles.input, ...styles.inputError } : styles.input}
      />
      <div style={styles.error}>{userIdError || ""}</div>
      <input
        type="text"
        placeholder="닉네임"
        value={nickname}
        onChange={e => setNickname(e.target.value)}
        onBlur={e => checkDuplicate("nickname", e.target.value)}
        required
        style={nicknameError ? { ...styles.input, ...styles.inputError } : styles.input}
      />
      <div style={styles.error}>{nicknameError || ""}</div>
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={styles.input}
      />
      <button
        type="submit"
        disabled={loading || !!userIdError || !!nicknameError}
        style={loading || !!userIdError || !!nicknameError ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
      >
        {loading ? "발송 중..." : "초대 메일 발송"}
      </button>
      {message && (
        <div
          style={{
            ...styles.message,
            color: message.includes("실패") ? "#e74c3c" : "#22c55e",
          }}
        >
          {message}
        </div>
      )}
    </form>
  );
};

export default MemberInviteForm;