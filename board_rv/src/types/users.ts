// src/types/Admin.ts
export interface Admin {
  id: string;
  userId: string;
  nickname: string;
  team: "관리팀" | "보안팀" | "사업팀" | "개발팀";
  phone: string; // 전화번호 필드 추가
}
// 데이터 구조 (타입,인터페이스)정의
export interface Column {
  key: string;
  label: string;
}

export interface AdminDataTableProps {
  data: any[];
  columns: Column[];
  loading: boolean;
  selectedTeam: "dev" | "biz" | "security";
  selectedTeamLabel: string;
  fetchData?: () => void;
}

export interface Member {
    id: string;
    userId: string;
    nickname: string;
    email: string;
    joinedAt: string;
    company_name?: string; // ← 이 줄 추가
}