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
    SECURITY: `${API_BASE}/security`,
    SECURITY_COLUMNS: `${API_BASE}/security/columns`,
    BIZ: `${API_BASE}/biz`,
    BIZ_COLUMNS: `${API_BASE}/biz/columns`,
    DEV: `${API_BASE}/dev`,
    DEV_COLUMNS: `${API_BASE}/dev/columns`,
    // 대시보드
    GCI_RANKINGS: `${API_BASE}/gci_rankings`,
    RISKY_COUNTRIES_MAP: `${API_BASE}/risky_countries/map_data`,
    // 그래프
    SECURITY_GRAPH: `${API_BASE}/security/graph`,
    BUSINESS_GRAPH: `${API_BASE}/business/graph`,
    DEV_GRAPH: `${API_BASE}/dev/graph`,
    // 관리자/멤버 관련
    ADMIN_LIST: `${API_BASE}/admin/list`,
    MEMBER_LIST: `${API_BASE}/member/list`,
    CHANGE_NICKNAME: `${API_BASE}/change-nickname`
};

export const getCrudEndpoint = (selectedTeam: string): string => {
    switch (selectedTeam) {
        case "dev":
            return API_URLS.DEV;
        case "biz":
            return API_URLS.BIZ;
        case "security":
            return API_URLS.SECURITY;
        default:
            throw new Error("잘못된 팀입니다.");
    }
};