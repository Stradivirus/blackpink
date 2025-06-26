import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URLS } from "../api/urls";
import "../styles/modal.css";

interface AuthFormProps {
    onSuccess?: (data: {
        token: string;
        id: number;
        userId: string;
        nickname: string;
        type: string;
        team?: string;
    }) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
    const { login } = useAuth();
    const [form, setForm] = useState({
        userId: "",
        password: "",
    });
    const [loginError, setLoginError] = useState<string>("");
    const [loading, setLoading] = useState(false);

    // 입력값 변경 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoginError("");
        setLoading(true);
        try {
            const res = await fetch(API_URLS.LOGIN, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: form.userId, password: form.password }),
            });
            if (res.ok) {
                const data = await res.json();
                // postpage에서만 member 로그인 허용
                if (
                    window.location.pathname === "/postpage" &&
                    data.type !== "member" &&
                    data.type !== "admin"
                ) {
                    setLoginError("회원 또는 관리자만 로그인할 수 있습니다.");
                    setLoading(false);
                    return;
                }
                login(
                    data.token || "dummy-token",
                    {
                        id: data.id,
                        userId: data.userId,
                        nickname: data.nickname,
                        type: data.type,
                        team: data.team,
                    }
                );
                if (onSuccess) onSuccess(data);
            } else {
                let msg = "아이디 또는 비밀번호가 올바르지 않습니다.";
                try {
                    const errData = await res.json();
                    if (errData?.detail) msg = errData.detail;
                } catch {}
                setLoginError(msg);
            }
        } catch (err) {
            setLoginError("로그인 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="modal-form" onSubmit={handleSubmit}>
            <h3 className="modal-message" style={{ marginBottom: 12 }}>
                로그인
            </h3>
            <div>
                <input
                    className="modal-input"
                    name="userId"
                    type="text"
                    placeholder="아이디"
                    value={form.userId}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                />
            </div>
            <div>
                <input
                    className="modal-input"
                    name="password"
                    type="password"
                    placeholder="비밀번호"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    autoComplete="current-password"
                />
            </div>
            {loginError && (
                <div className="validation invalid" style={{ color: "red", marginBottom: 8 }}>
                    {loginError}
                </div>
            )}
            <button className="board-btn" type="submit" disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
            </button>
        </form>
    );
};

export default AuthForm;