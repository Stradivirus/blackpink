import { useState, useEffect } from "react";
import { API_URLS } from "../api/urls";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; 

// 비밀번호 변경 폼 컴포넌트
const ChangePasswordForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
    const { user, logout } = useAuth(); // 인증 정보와 로그아웃 함수 사용
    const [oldPassword, setOldPassword] = useState(""); // 기존 비밀번호
    const [newPassword, setNewPassword] = useState(""); // 새 비밀번호
    const [confirmPassword, setConfirmPassword] = useState(""); // 새 비밀번호 확인
    const [message, setMessage] = useState<string | null>(null); // 안내 메시지
    const [loading, setLoading] = useState(false); // 로딩 상태
    const [showMatch, setShowMatch] = useState(false); // 비밀번호 일치 여부
    const navigate = useNavigate(); // 페이지 이동 훅

    // 새 비밀번호와 확인값이 일치하는지 체크
    useEffect(() => {
        if (newPassword && confirmPassword && newPassword === confirmPassword) {
            setShowMatch(true);
        } else {
            setShowMatch(false);
        }
    }, [newPassword, confirmPassword]);

    // 폼 제출 시 비밀번호 변경 요청
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage("새 비밀번호가 일치하지 않습니다.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(API_URLS.CHANGE_PASSWORD, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.userId,
                    old_password: oldPassword,
                    new_password: newPassword,
                    accountType: user?.type || "member",
                }),
            });
            if (res.ok) {
                setMessage("비밀번호가 성공적으로 변경되었습니다. 다시 로그인 해주세요.");
                setTimeout(() => {
                    logout(); // 로그아웃 처리
                    navigate("/"); // 메인으로 이동
                    if (onSuccess) onSuccess();
                }, 1000);
            } else {
                const data = await res.json();
                setMessage(data.detail || "비밀번호 변경에 실패했습니다.");
            }
        } catch {
            setMessage("서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 비밀번호 변경 폼 렌더링
    return (
        <form onSubmit={handleSubmit} style={{ minWidth: 280 }}>
            <h3 style={{ marginBottom: 12 }}>비밀번호 변경</h3>
            <div>
                <input
                    type="password"
                    placeholder="기존 비밀번호"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    required
                    style={{ width: "100%", marginBottom: 8, padding: 8 }}
                />
            </div>
            <div>
                <input
                    type="password"
                    placeholder="새 비밀번호"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ width: "100%", marginBottom: 8, padding: 8 }}
                />
            </div>
            <div>
                <input
                    type="password"
                    placeholder="새 비밀번호 확인"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ width: "100%", marginBottom: 8, padding: 8 }}
                />
                {confirmPassword && (
                    <div style={{ marginTop: 4, color: showMatch ? "green" : "red", fontSize: 13 }}>
                        {showMatch
                            ? "비밀번호가 일치합니다."
                            : "비밀번호가 일치하지 않습니다."}
                    </div>
                )}
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: 8 }}>
                {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
            {message && (
                <div style={{ marginTop: 10, color: message.includes("성공") ? "green" : "red" }}>
                    {message}
                </div>
            )}
        </form>
    );
};

export default ChangePasswordForm;