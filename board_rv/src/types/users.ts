// src/types/Admin.ts
// 관리자 타입
export interface Admin {
  id: string;
  userId: string;
  nickname: string;
  team: "관리팀" | "보안팀" | "사업팀" | "개발팀";
  phone: string; // 전화번호 필드 추가
}

// 테이블 컬럼 타입
export interface Column {
  key: string;
  label: string;
}

// 어드민 데이터 테이블 props 타입
export interface AdminDataTableProps {
  data: any[];
  columns: Column[];
  loading: boolean;
  selectedTeam: "dev" | "biz" | "security";
  selectedTeamLabel: string;
  fetchData?: () => void;
}

// 멤버 타입
export interface Member {
  id: string;
  userId: string;
  nickname: string;
  email: string;
  joinedAt: string;
  company_name?: string;
}