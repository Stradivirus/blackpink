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
    // 그래프
    GCI_RANKINGS: `${API_BASE}/gci_rankings`,
    RISKY_COUNTRIES_MAP: `${API_BASE}/risky_countries/map_data`,
    GRAPH: `${API_BASE}/graph`,
    // 비즈니스 그래프 (사업팀)
    BUSINESS_BAR: `${API_BASE}/business/bar`,
    BUSINESS_HEATMAP: `${API_BASE}/business/heatmap`,
    BUSINESS_ANNUAL_SALES: `${API_BASE}/business/annual_sales`,
    BUSINESS_COMPANY_PLAN_HEATMAP: `${API_BASE}/business/company_plan_heatmap`,
    BUSINESS_COMPANY_PLAN_DONUT_MULTI: `${API_BASE}/business/company_plan_donut_multi`,
    BUSINESS_TERMINATED_DURATION: `${API_BASE}/business/terminated_duration`,
    BUSINESS_SUSPENDED_PLAN: `${API_BASE}/business/suspended_plan`,
    // 관리자/멤버 관련
    ADMIN_LIST: `${API_BASE}/admin/list`,
    MEMBER_LIST: `${API_BASE}/member/list`,
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