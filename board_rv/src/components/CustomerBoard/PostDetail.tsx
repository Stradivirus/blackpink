import React, {useEffect, useState} from "react";
import {useParams, Link, useNavigate, useLocation} from "react-router-dom";
import type {Post} from "../../types/Board";
import {API_URLS} from "../../api/urls";
import {useAuth} from "../../context/AuthContext";
import CommentList from "./CommentList";
import "../../styles/Board.css";
import "../../styles/modal.css";

// 최근 게시글 5개를 보여주는 컴포넌트
const RecentPostList: React.FC<{ excludeId?: string }> = ({excludeId}) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // 최근 게시글 fetch
    useEffect(() => {
        setError(null);
        fetch(`${API_URLS.POSTS}?page=0&size=6&sort=createdDate,desc`)
            .then(res => {
                if (!res.ok) throw new Error("최신 글을 불러오지 못했습니다.");
                return res.json();
            })
            .then(data => {
                setTotalElements(data.totalElements || 0);
                const filtered = (data.content || []).filter((post: Post) => String(post.id) !== excludeId).slice(0, 5);
                setPosts(filtered);
            })
            .catch(err => setError(err.message || "최신 글을 불러오는 중 오류가 발생했습니다."));
    }, [excludeId]);

    if (error) return <div className="error-message">{error}</div>;
    if (!posts.length) return null;

    return (
        <section className="board-container" style={{marginTop: 48}}>
            <h3 style={{fontSize: "1.3rem", fontWeight: 700, marginBottom: 18, color: "#2c3550"}}>
                최신 글 5개
            </h3>
            <table className="board-table">
                <thead>
                <tr>
                    <th style={{width: "7%"}}>번호</th>
                    <th style={{width: "45%"}}>제목</th>
                    <th>작성자</th>
                    <th>작성일</th>
                    <th>작성시간</th>
                    <th>조회수</th>
                </tr>
                </thead>
                <tbody>
                {posts.map((post, idx) => {
                    // 전체 글 개수에서 idx만큼 빼서 역순 번호
                    const displayNumber = totalElements - idx;
                    return (
                        <tr key={post.id}>
                            <td>{displayNumber}</td>
                            <td>
                                <Link to={`/posts/${post.id}`} className="board-post-title-link">
                                    {post.title}
                                </Link>
                            </td>
                            <td className="board-post-author">{post.writerNickname || "-"}</td>
                            <td className="board-post-date">{post.createdDate}</td>
                            <td className="board-post-date">{post.createdTime}</td>
                            <td className="board-post-views">{post.viewCount}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </section>
    );
};

// 삭제 확인 모달 컴포넌트
const ConfirmModal: React.FC<{
    open: boolean;
    x: number;
    y: number;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({open, x, y, onConfirm, onCancel}) => {
    if (!open) return null;
    return (
        <div
            className="modal-follow"
            style={{
                position: "absolute",
                left: x,
                top: y,
                zIndex: 2000,
            }}
        >
            <button className="board-btn" onClick={onConfirm}>예</button>
            <button className="board-btn cancel" onClick={onCancel} style={{marginLeft: 8}}>아니오</button>
        </div>
    );
};

// 게시글 상세 페이지 컴포넌트
const PostDetail: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const page = query.get("page") || "0";
    const [post, setPost] = useState<Post | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [modalPos, setModalPos] = useState({x: 0, y: 0});
    const navigate = useNavigate();
    const {user} = useAuth();

    // 게시글 정보 fetch
    useEffect(() => {
        if (id) {
            setError(null);
            fetch(API_URLS.POST(id))
                .then(res => {
                    if (!res.ok) throw new Error("글 정보를 불러오지 못했습니다.");
                    return res.json();
                })
                .then(data => setPost(data))
                .catch(err => setError(err.message || "글 정보를 불러오지 못했습니다."));
        }
    }, [id]);

    // 삭제 처리 함수
    const handleDelete = async () => {
        if (!id) return;
        setIsDeleting(true);
        setError(null);
        try {
            const res = await fetch(API_URLS.POST(id), { method: "DELETE" });
            if (!res.ok) throw new Error("삭제에 실패했습니다.");
            navigate("/postpage");
        } catch (err: any) {
            setError(err?.message || "삭제 중 오류가 발생했습니다.");
            alert(err?.message || "삭제 중 오류가 발생했습니다.");
        } finally {
            setIsDeleting(false);
        }
    };

    // 삭제 버튼 클릭 시 모달 위치 지정
    const handleDeleteClick = (e: React.MouseEvent) => {
        setModalPos({
            x: e.clientX + window.scrollX,
            y: e.clientY + window.scrollY,
        });
        setShowConfirm(true);
    };

    if (error) {
        return (
            <>
                <div className="board-detail-container">
                    <div className="error-message">{error}</div>
                    <div className="board-detail-btn-group board-detail-btn-group-right">
                        <Link to={`/postpage?page=${page}`} className="board-btn cancel">목록으로</Link>
                    </div>
                </div>
            </>
        );
    }

    if (!post) return (
        <>
            <div className="board-detail-container">로딩 중...</div>
        </>
    );

    return (
        <>
            <main className="board-detail-container board-detail-outer">
                <div className="board-detail-title board-detail-title-strong">
                    {post.title}
                </div>
                <div className="board-detail-meta board-detail-meta-flex">
                    <span><b>작성자</b> {post.writerNickname || "-"}</span>
                    <span><b>작성일</b> {post.createdDate}</span>
                    <span><b>작성시간</b> {post.createdTime}</span>
                    <span><b>조회수</b> {post.viewCount}</span>
                </div>
                <div className="board-detail-content board-detail-content-bg">
                    {post.content}
                </div>
                {/* 본인만 수정/삭제 가능 */}
                {user && String(user.userId) === post.writerId ? (
                    <div className="board-detail-btn-group board-detail-btn-group-right">
                        <Link to={`/posts/${post.id}/edit`}>
                            <button className="board-btn">수정</button>
                        </Link>
                        <button
                            className="board-btn"
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "삭제 중..." : "삭제"}
                        </button>
                        <Link to={`/postpage?page=${page}`} className="board-btn cancel">목록으로</Link>
                    </div>
                ) : (
                    <div className="board-detail-btn-group board-detail-btn-group-right">
                        <Link to={`/postpage?page=${page}`} className="board-btn cancel">목록으로</Link>
                    </div>
                )}
                <ConfirmModal
                    open={showConfirm}
                    x={modalPos.x}
                    y={modalPos.y}
                    onConfirm={() => {
                        setShowConfirm(false);
                        handleDelete();
                    }}
                    onCancel={() => setShowConfirm(false)}
                />
            </main>
            {/* 댓글 목록 */}
            <CommentList postId={post.id} />
            {/* 최근 게시글 5개 */}
            <RecentPostList excludeId={String(post.id)}/>
        </>
    );
};

export default PostDetail;