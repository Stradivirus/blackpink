import React, { useEffect, useState } from "react";
import { API_URLS } from "../../api/urls";
import type { Comment } from "../../types/Comment";
import { useAuth } from "../../context/AuthContext";
import "../../styles/comment.css";

const CommentList: React.FC<{ postId: string }> = ({ postId }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [content, setContent] = useState("");
    const [isAnswered, setIsAnswered] = useState(false); // 답변완료 체크박스 상태
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchComments = () => {
        fetch(API_URLS.COMMENTS(postId))
            .then(res => res.json())
            .then(setComments)
            .catch(() => setError("댓글을 불러오지 못했습니다."));
    };

    useEffect(() => {
        fetchComments();
        // eslint-disable-next-line
    }, [postId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!user) {
            setError("로그인 후 댓글을 작성할 수 있습니다.");
            return;
        }
        if (!content.trim()) {
            setError("댓글 내용을 입력하세요.");
            return;
        }
        const body: any = {
            postId,
            writerId: user.userId, // userId로 변경
            content,
        };
        if (user.type === "admin") {
            body.isAnswered = isAnswered;
        }
        const res = await fetch(API_URLS.COMMENT_CREATE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            setError("댓글 작성에 실패했습니다.");
            return;
        }
        setContent("");
        setIsAnswered(false);
        fetchComments();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
        const res = await fetch(API_URLS.COMMENT_DELETE(id), { method: "DELETE" });
        if (!res.ok) {
            setError("댓글 삭제에 실패했습니다.");
            return;
        }
        fetchComments();
    };

    return (
        <section className="comment-section">
            <h4>댓글</h4>
            <ul className="comment-list">
                {comments.length === 0 && <li>댓글이 없습니다.</li>}
                {[...comments]
                    .sort((a, b) => new Date(b.createdDate + ' ' + b.createdTime).getTime() - new Date(a.createdDate + ' ' + a.createdTime).getTime())
                    .map(c => (
                        <li key={c.id}>
                            <div className="comment-meta">
                                <b>
                                    {c.writerNickname}
                                    {c.team && ` (${c.team})`}
                                    {c.isAnswered && <span style={{color:'#1976d2', marginLeft:4}}>[답변완료]</span>}
                                </b>
                                <span style={{ color: "#888", marginLeft: 8 }}>{c.createdDate} {c.createdTime}</span>
                                {user && String(user.userId) === String(c.writerId) && ( // userId로 비교
                                    <button
                                        className="comment-delete-btn"
                                        onClick={() => handleDelete(c.id)}
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>
                            <div className="comment-content">{c.content}</div>
                        </li>
                    ))}
            </ul>
            {/* 관리자만 답변완료 체크박스 노출 */}
            {user && user.type === "admin" && (
                <form onSubmit={handleSubmit} className="comment-form" style={{ marginTop: 18 }}>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={3}
                        placeholder="댓글을 입력하세요"
                    />
                    <label style={{display:'block',marginTop:8}}>
                        <input
                            type="checkbox"
                            checked={isAnswered}
                            onChange={e => setIsAnswered(e.target.checked)}
                        /> 답변완료로 표시
                    </label>
                    <button type="submit" disabled={!user} style={{ marginTop: 8 }}>
                        작성
                    </button>
                </form>
            )}
            {/* 일반회원은 기존 폼 그대로 */}
            {user && user.type !== "admin" && (
                <form onSubmit={handleSubmit} className="comment-form" style={{ marginTop: 18 }}>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={3}
                        placeholder="댓글을 입력하세요"
                    />
                    <button type="submit" disabled={!user} style={{ marginTop: 8 }}>
                        작성
                    </button>
                </form>
            )}
            {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
        </section>
    );
};

export default CommentList;