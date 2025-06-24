import React, {useState, useEffect} from "react";
import {useNavigate, useParams, Link} from "react-router-dom";
import {API_URLS} from "../../api/urls";
import {useAuth} from "../../context/AuthContext";
import "../../styles/Board.css";

interface Props {
    isEdit?: boolean;
}

const PostForm: React.FC<Props> = ({isEdit}) => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [form, setForm] = useState({
        title: "",
        content: "",
        writerId: user?.userId ?? "", // userId로 변경
        writerNickname: user?.nickname ?? "",
        isNotice: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setForm(f => ({...f, writerId: user.userId})); // userId로 변경
        }
    }, [user]);

    // 수정 모드일 때 기존 데이터 불러오기 (isNotice 포함)
    useEffect(() => {
        if (isEdit && id && user) {
            setError(null);
            fetch(`${API_URLS.POST}/${id}`)
                .then(res => res.json())
                .then(data => {
                    setForm({
                        title: data.title,
                        content: data.content,
                        writerId: data.writerId, // 이미 userId 문자열
                        writerNickname: data.writerNickname,
                        isNotice: !!data.isNotice,
                    });
                })
                .catch(() => setError("게시글 정보를 불러오지 못했습니다."));
        }
    }, [isEdit, id, user]);

    useEffect(() => {
        if (error) {
            alert(error);
        }
    }, [error]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({...form, [e.target.name]: e.target.value});
    };

    // 2. 체크박스 핸들러 추가
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({...form, isNotice: e.target.checked});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const method = isEdit ? "PUT" : "POST";
            const url = isEdit ? `${API_URLS.POST}/${id}` : API_URLS.POSTS;
            const body = {
                ...form,
                writerId: user?.userId, // userId로 변경
                writerNickname: user?.nickname,
            };
            const res = await fetch(url, {
                method,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("저장에 실패했습니다.");
            navigate("/board");
        } catch (err: any) {
            setError(err.message || "오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return (
            <main className="board-form-container board-form-container--detail">
                <div className="error-message">로그인 후 글쓰기가 가능합니다.</div>
                <Link to="/" className="board-btn" style={{marginTop: 24}}>목록으로</Link>
            </main>
        );
    }

    return (
        <>
            <main className="board-form-container board-form-container--detail">
                <h2 className="board-form-title board-form-title--mb">
                    {isEdit ? "글 수정" : "글 작성"}
                </h2>
                {error && <div className="error-message" style={{marginBottom: 16}}>{error}</div>}
                <form onSubmit={handleSubmit} className="board-form">
                    <label className="board-form-label" htmlFor="title">
                        제목
                        <input
                            className="board-form-input"
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            required
                            placeholder="제목을 입력하세요"
                        />
                    </label>
                    <label className="board-form-label board-content-label" htmlFor="content">
                        내용
                        <textarea
                            className="board-form-textarea"
                            id="content"
                            name="content"
                            value={form.content}
                            onChange={handleChange}
                            required
                            rows={8}
                            placeholder="내용을 입력하세요"
                            maxLength={2000}
                        />
                    </label>
                    {/* 2. 관리자만 공지 체크박스 노출 */}
                    {user.type === "admin" && (
                        <label>
                            <input
                                type="checkbox"
                                name="isNotice"
                                checked={form.isNotice}
                                onChange={handleCheckboxChange}
                            />
                            공지사항으로 등록
                        </label>
                    )}
                    <div className="board-form-btn-group board-form-btn-group--right">
                        <button type="submit" className="board-btn" disabled={isSubmitting}>
                            {isEdit ? "수정" : "작성"}
                        </button>
                        <Link to="/postpage" className="board-btn cancel">
                            취소
                        </Link>
                    </div>
                </form>
            </main>
        </>
    );
};

export default PostForm;