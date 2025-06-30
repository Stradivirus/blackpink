import { useState } from "react";
import axios from "axios";
import { API_URLS } from "../../api/urls";
import type { Admin } from "../../types/users";
import styles from "./MemberInviteForm.styles";
import { teamLabelMap } from "../../constants/dataconfig"; // 팀 라벨 맵 import

// 관리자 팀 목록 상수 (teamLabelMap의 key를 사용)
const ADMIN_TEAMS: Admin["team"][] = Object.keys(teamLabelMap) as Admin["team"][];

// 회원 초대(계정 발급) 폼 컴포넌트
const MemberInviteForm: React.FC = () => {
  const [userId, setUserId] = useState(""); // 아이디 입력값
  const [nickname, setNickname] = useState(""); // 닉네임 입력값
  const [email, setEmail] = useState(""); // 이메일 입력값
  const [accountType, setAccountType] = useState<"member" | "admin">("member"); // 계정 유형
  const [team, setTeam] = useState<Admin["team"]>("관리팀"); // 관리자 팀 선택값
  const [message, setMessage] = useState<string | null>(null); // 안내 메시지
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [userIdError, setUserIdError] = useState<string | null>(null); // 아이디 중복 에러
  const [nicknameError, setNicknameError] = useState<string | null>(null); // 닉네임 중복 에러
  const [companyName, setCompanyName] = useState(""); // 회사명
  const [companyId, setCompanyId] = useState(""); // 회사코드
  const [companyInput, setCompanyInput] = useState(""); // 회사 검색 입력값
  const [companyResults, setCompanyResults] = useState<any[]>([]); // 회사 검색 결과
  const [companySearchLoading, setCompanySearchLoading] = useState(false); // 회사 검색 로딩
  const [phone, setPhone] = useState(""); // 전화번호 입력값
  const [phoneError, setPhoneError] = useState<string | null>(null); // 전화번호 에러

  // 아이디/닉네임 중복 체크
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

  // 회사명/코드로 검색
  const handleCompanySearch = async () => {
    if (!companyInput) {
      setCompanyResults([]);
      return;
    }
    setCompanySearchLoading(true);
    try {
      // name 또는 id로 검색 (백엔드에서 둘 다 지원해야 함)
      const res = await axios.get("/api/company/search", { params: { keyword: companyInput } });
      setCompanyResults(res.data || []);
    } catch {
      setCompanyResults([]);
    } finally {
      setCompanySearchLoading(false);
    }
  };

  // 검색 결과에서 회사 선택 시
  const handleCompanySelect = (company: any) => {
    setCompanyName(company.company_name);
    setCompanyId(company.company_id);
    setCompanyInput(""); // 검색창 초기화
    setCompanyResults([]);
  };

  // 전화번호 입력 핸들러(숫자만 허용)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhone(value);
    if (value.length !== 10 && value.length !== 11) {
      setPhoneError("전화번호는 10자리 또는 11자리여야 합니다.");
    } else {
      setPhoneError(null);
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 서버에 중복 체크 한 번 더
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

    // 중복이 없으면 회원 초대 진행
    try {
      const payload: any = {
        userId,
        nickname,
        email,
        accountType,
        company_id: companyId,
        company_name: companyName,
      };
      if (accountType === "admin") {
        payload.team = team;
        payload.phone = phone; // 관리자일 때만 전화번호 포함
      }
      await axios.post(API_URLS.MEMBER_INVITE, payload);
      setMessage("임시 비밀번호가 이메일로 발송되었습니다.");
      setUserId("");
      setNickname("");
      setEmail("");
      setTeam("관리팀");
      setPhone("");
      setCompanyName("");
      setCompanyId("");
      setCompanyInput("");
      setCompanyResults([]);
    } catch (err: any) {
      setMessage(
        err.response?.data?.detail || "회원 초대에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  // 폼 렌더링
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
        <>
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
          <input
            type="text"
            placeholder="전화번호"
            value={phone}
            onChange={handlePhoneChange}
            required
            style={phoneError ? { ...styles.input, ...styles.inputError } : styles.input}
            maxLength={11}
            inputMode="numeric"
            pattern="\d*"
          />
          <div style={styles.error}>{phoneError || ""}</div>
        </>
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
      {accountType === "member" && (
        <>
          {/* 회사명/코드 검색창 + 버튼 */}
          <div style={styles.companySearchWrap}>
            <input
              type="text"
              placeholder="회사명 또는 회사코드 입력"
              value={companyInput}
              onChange={e => setCompanyInput(e.target.value)}
              style={{ ...styles.input, marginBottom: 0, flex: 1 }}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={handleCompanySearch}
              style={{
                ...styles.companySearchBtn,
                height: "48px",
                fontSize: "16px",
                borderRadius: "9px",
                marginBottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
              }}
            >
              검색
            </button>
            {companySearchLoading && (
              <div style={styles.searchLoading}>
                검색 중...
              </div>
            )}
          </div>
          {/* 검색 결과 드롭다운 */}
          {companyResults.length > 0 && (
            <div
              style={{
                position: "relative",
                width: "100%",
                zIndex: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1.5px solid #d0d7de",
                  borderRadius: 9,
                  maxHeight: 200,
                  overflowY: "auto" as const,
                  boxShadow: "0 2px 12px 0 rgba(0,0,0,0.10)",
                  zIndex: 20,
                }}
              >
                {companyResults.map((c) => (
                  <div
                    key={c.company_id}
                    style={{
                      padding: "12px 18px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f1f1",
                      background: "#fff",
                      transition: "background 0.15s",
                    }}
                    onClick={() => handleCompanySelect(c)}
                  >
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.company_name}</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>코드: {c.company_id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* 회사명/회사코드 자동 입력 */}
          <input
            type="text"
            placeholder="회사명"
            value={companyName}
            readOnly
            style={styles.input}
          />
          <input
            type="text"
            placeholder="회사코드"
            value={companyId}
            readOnly
            style={styles.input}
          />
        </>
      )}
      <button
        type="submit"
        disabled={loading || !!userIdError || !!nicknameError || !!phoneError}
        style={loading || !!userIdError || !!nicknameError || !!phoneError ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
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