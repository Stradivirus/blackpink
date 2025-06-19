// const API_BASE = "http://141.147.144.151:8001/api";
const API_BASE = "http://localhost:8000/api";
export const API_URLS = {
    POSTS: `${API_BASE}/posts`,
    POST: (id: string) => `${API_BASE}/posts/${id}`,
    LOGIN: `${API_BASE}/login`,
    COMMENTS: (postId: string) => `${API_BASE}/comments/${postId}`,
    COMMENT_CREATE: `${API_BASE}/comments`,
    COMMENT_DELETE: (id: string) => `${API_BASE}/comments/${id}`,
    MEMBER_INVITE: `${API_BASE}/admin/member-invite`,
    CHANGE_PASSWORD: `${API_BASE}/change-password`,
    CHECK_DUPLICATE: `${API_BASE}/admin/check-duplicate`,
    INCIDENT: `${API_BASE}/incident`,
    COMPANIES: `${API_BASE}/companies`,
    DEV: `${API_BASE}/dev`,
};

export const GRAPH_API = "http://localhost:8000/graph";
