// const API_BASE = "http://141.147.144.151:8001/api";
const API_BASE = "http://localhost:8000/api";
export const API_URLS = {
    // 게시판
    POSTS: `${API_BASE}/posts`,
    POST: (id: string) => `${API_BASE}/posts/${id}`,
    COMMENTS: (postId: string) => `${API_BASE}/comments/${postId}`,
    COMMENT_CREATE: `${API_BASE}/comments`,
    COMMENT_DELETE: (id: string) => `${API_BASE}/comments/${id}`,
    // 로그인
    LOGIN: `${API_BASE}/login`,
    MEMBER_INVITE: `${API_BASE}/admin/member-invite`,
    CHANGE_PASSWORD: `${API_BASE}/change-password`,
    CHECK_DUPLICATE: `${API_BASE}/admin/check-duplicate`,
    // 데이터
    INCIDENT: `${API_BASE}/incident`,
    COMPANIES: `${API_BASE}/companies`,
    DEV: `${API_BASE}/dev`,
    // 그래프
    GCI_RANKINGS: `${API_BASE}/gci_rankings`,
    RISKY_COUNTRIES_MAP: `${API_BASE}/risky_countries/map_data`,
    THREAT_REPORTS_COUNT: `${API_BASE}/threat_reports/count`,
    GRAPH: `${API_BASE}/graph`,
    // 관리자/멤버 관련
    ADMIN_LIST: `${API_BASE}/admin/list`,
    MEMBER_LIST: `${API_BASE}/member/list`,
};