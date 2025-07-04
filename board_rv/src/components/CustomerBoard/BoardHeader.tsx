import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../../styles/Board.css";
import Modal from "../Modal";
import AuthForm from "../AuthForm";
import ChangePasswordForm from "../ChangePasswordForm";

// 게시판 상단 헤더 컴포넌트
const BoardHeader = () => {
    const { isLoggedIn, user, logout } = useAuth(); // 인증 상태 및 사용자 정보
    const [modalOpen, setModalOpen] = useState(false); // 로그인 모달 상태
    const [pwModalOpen, setPwModalOpen] = useState(false); // 비밀번호 변경 모달 상태
    const navigate = useNavigate(); // 페이지 이동 함수

    const openModal = () => {
        setModalOpen(true); // 로그인 모달 열기
    };

    const handleProfileClick = () => {
        alert("프로필 기능은 추후 추가됩니다."); // 프로필 클릭 시 안내
    };

    // 로그아웃 시 홈으로 이동
    const handleLogout = () => {
        logout();
        setTimeout(() => {
            navigate("/postpage");
        }, 0);
    };

    return (
        <header
            className="board-header board-header--mb"
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <div>
                <h1 className="board-header__title">고객 게시판</h1>
                <p className="board-header__desc">
                    자유롭게 글을 작성하고 소통하는 공간입니다.
                </p>
            </div>
            <div className="board-header__profile" style={{ display: "flex", alignItems: "center" }}>
                {/* 어드민이면 대시보드로 버튼 노출 */}
                {isLoggedIn && user?.type === "admin" && (
                    <button
                        className="board-btn"
                        style={{ marginRight: 12, background: "#1976d2", color: "#fff" }}
                        onClick={() => navigate("/admin")}
                    >
                        대시보드로
                    </button>
                )}
                {isLoggedIn ? (
                    <>
                        <button
                            className="board-btn profile-btn"
                            style={{ marginRight: 12 }}
                            onClick={handleProfileClick}
                        >
                            {user?.nickname}님
                        </button>
                        <button
                            className="board-btn"
                            style={{ marginRight: 12 }}
                            onClick={() => setPwModalOpen(true)}
                        >
                            비밀번호 변경
                        </button>
                        <button className="board-btn" onClick={handleLogout}>
                            로그아웃
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="board-btn"
                            onClick={openModal}
                            style={{ marginRight: 10 }}
                        >
                            로그인
                        </button>
                    </>
                )}
            </div>
            {/* 로그인 모달 */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <AuthForm onSuccess={() => setModalOpen(false)} />
            </Modal>
            {/* 비밀번호 변경 모달 */}
            <Modal open={pwModalOpen} onClose={() => setPwModalOpen(false)}>
                <ChangePasswordForm onSuccess={() => setPwModalOpen(false)} />
            </Modal>
        </header>
    );
};

export default BoardHeader;