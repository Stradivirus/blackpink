// src/types/Admin.ts
// 데이터 구조 (타입,인터페이스)정의
export interface Column {
  key: string;
  label: string;
}

export interface AdminDataTableProps {
  data: any[];
  columns: Column[];
  loading: boolean;
  selectedTeam: string;
  selectedTeamLabel: string;
}
