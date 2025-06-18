import { useState } from "react";
import {useAuth} from "../context/AuthContext";
import {API_URLS} from "../api/urls";
import "../styles/modal.css";

interface AuthFormProps {
    onSuccess?: (data: { token: string; id: number; userId: string; nickname: string }) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
    const {login} = useAuth();
    const [form, setForm] = useState({
        userId: "",
        password: "",
    });
    const [loginError, setLoginError] = useState<string>("");

    // 입력값 변경 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setForm({...form, [name]: value});
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        try {
            const res = await fetch(API_URLS.LOGIN, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({userId: form.userId, password: form.password}),
            });
            if (res.ok) {
                const data = await res.json();
                // postpage에서만 member 로그인 허용
                if (window.location.pathname === "/postpage" && data.type !== "member") {
                    setLoginError("회원만 로그인할 수 있습니다.");
                    return;
                }
                login(
                    data.token || "dummy-token",
                    {id: data.id, userId: data.userId, nickname: data.nickname, type: data.type}
                );
                if (onSuccess) onSuccess(data);
            } else {
                setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
            }
        } catch (err) {
            setLoginError("로그인 오류가 발생했습니다.");
        }
    };

    return (
        <form className="modal-form" onSubmit={handleSubmit}>
            <h3 className="modal-message" style={{marginBottom: 12}}>
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
                />
            </div>
            {loginError && (
                <div className="validation invalid" style={{color: "red", marginBottom: 8}}>
                    {loginError}
                </div>
            )}
            <button className="board-btn" type="submit">
                로그인
            </button>
        </form>
    );
};

export default AuthForm;