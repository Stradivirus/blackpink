import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Post } from "../../types/Board";
import { API_URLS } from "../../api/urls";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Board.css";

// 한 페이지에 보여줄 게시글 수
const PAGE_SIZE = 12;

// 게시글 목록 컴포넌트
const PostList: React.FC = () => {
    const location = useLocation(); // 현재 URL 정보
    const navigate = useNavigate(); // 페이지 이동 함수
    const query = new URLSearchParams(location.search); // 쿼리 파싱
    const page = parseInt(query.get("page") || "0", 10); // 현재 페이지 번호
    const [posts, setPosts] = useState<Post[]>([]); // 게시글 목록
    const [totalPages, setTotalPages] = useState(1); // 전체 페이지 수
    const [totalElements, setTotalElements] = useState(0); // 전체 게시글 수
    const [error, setError] = useState<string | null>(null); // 에러 메시지
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태
    const { user } = useAuth(); // 로그인 사용자 정보

    // 게시글 목록 fetch
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        fetch(`${API_URLS.POSTS}?page=${page}&size=${PAGE_SIZE}`)
            .then(res => {
                if (!res.ok) throw new Error("게시글을 불러오지 못했습니다.");
                return res.json();
            })
            .then(data => {
                setPosts(data.content || []);
                setTotalPages(data.totalPages || 1);
                setTotalElements(data.totalElements || 0);
            })
            .catch(err => {
                setPosts([]);
                setTotalPages(1);
                setTotalElements(0);
                setError(err.message || "게시글을 불러오는 중 오류가 발생했습니다.");
            })
            .finally(() => setIsLoading(false));
    }, [page, location.search]);

    // 이전 페이지 이동
    const handlePrev = () => {
        if (page > 0) {
            navigate(`/postpage?page=${page - 1}`);
        }
    };
    // 다음 페이지 이동
    const handleNext = () => {
        if (page + 1 < totalPages) {
            navigate(`/postpage?page=${page + 1}`);
        }
    };

    // 공지/일반 게시글 분리
    const noticePosts = posts.filter(p => p.isNotice);
    const normalPosts = posts.filter(p => !p.isNotice);

    return (
        <>
            <main className="board-main">
                <div className="board-title-bar">
                    <h2>게시글 목록</h2>
                    {user ? (
                        <Link to="/new">
                            <button className="board-write-btn">글쓰기</button>
                        </Link>
                    ) : (
                        <button className="board-write-btn" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            글쓰기 (로그인 필요)
                        </button>
                    )}
                </div>
                {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
                <table className="board-table">
                    <thead>
                        <tr>
                            <th style={{ width: "7%" }}>번호</th>
                            <th style={{ width: "45%" }}>제목</th>
                            <th>작성자</th>
                            <th>작성일</th>
                            <th>작성시간</th>
                            <th>조회수</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', color: '#aaa' }}>
                                    불러오는 중...
                                </td>
                            </tr>
                        ) : posts.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', color: '#aaa' }}>
                                    게시글이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            <>
                                {/* 공지글 렌더링 */}
                                {noticePosts.map((post) => (
                                    <tr key={post.id} className="notice-row">
                                        <td className="board-post-id" style={{ color: "#d32f2f", fontWeight: 700 }}>공지</td>
                                        <td>
                                            <Link
                                                to={`/posts/${post.id}?page=${page}`}
                                                className="board-post-title-link"
                                                style={{ fontWeight: 700, color: "#d32f2f" }}
                                            >
                                                📢 {post.title}
                                            </Link>
                                        </td>
                                        <td className="board-post-author">{post.writerNickname || "-"}</td>
                                        <td className="board-post-date">{post.createdDate}</td>
                                        <td className="board-post-date">{post.createdTime}</td>
                                        <td className="board-post-views">{post.viewCount}</td>
                                    </tr>
                                ))}
                                {/* 일반글 렌더링 */}
                                {normalPosts.map((post, idx) => {
                                    const displayNumber = totalElements - (page * PAGE_SIZE) - idx;
                                    return (
                                        <tr key={post.id}>
                                            <td className="board-post-id">{displayNumber}</td>
                                            <td>
                                                <Link
                                                    to={`/posts/${post.id}?page=${page}`}
                                                    className="board-post-title-link"
                                                >
                                                    {post.title}
                                                    {post.isAnswered && (
                                                        <span style={{ color: '#555', fontWeight: 700, marginLeft: 8, fontStyle: 'italic' }}>(답변완료)</span>
                                                    )}
                                                </Link>
                                            </td>
                                            <td className="board-post-author">{post.writerNickname || "-"}</td>
                                            <td className="board-post-date">{post.createdDate}</td>
                                            <td className="board-post-date">{post.createdTime}</td>
                                            <td className="board-post-views">{post.viewCount}</td>
                                        </tr>
                                    );
                                })}
                            </>
                        )}
                    </tbody>
                </table>
                {/* 페이지네이션 */}
                <div className="board-pagination">
                    <button
                        onClick={handlePrev}
                        disabled={page === 0}
                    >이전
                    </button>
                    <span>페이지 {page + 1} / {totalPages}</span>
                    <button
                        onClick={handleNext}
                        disabled={page + 1 >= totalPages}
                    >다음
                    </button>
                </div>
            </main>
        </>
    );
};

export default PostList;