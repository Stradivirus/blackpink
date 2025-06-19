// src/constants/dataConfig.ts

// 팀 정의
export const teamList = [
  { key: "biz", label: "사업팀" },
  { key: "dev", label: "개발팀" },
  { key: "security", label: "보안팀" },
];

// 각 팀별 컬럼 정의
export const columnsByTeam: Record<string, { key: string; label: string }[]> = {
  biz: [
    { key: "company_id", label: "Company ID" },
    { key: "company_name", label: "회사명" },
    { key: "industry", label: "업종" },
    { key: "plan", label: "플랜" },
    { key: "contract_start", label: "계약 시작일" },
    { key: "contract_end", label: "계약 종료일" },
    { key: "status", label: "상태" },
    { key: "manager_name", label: "담당자명" },
    { key: "manager_phone", label: "담당자 연락처" },
  ],
  dev: [
    { key: "company_id", label: "Company ID" },
    { key: "os", label: "OS" },
    { key: "os_version", label: "OS 버전" },
    { key: "dev_start_date", label: "개발 시작일" },
    { key: "dev_end_date", label: "개발 종료일" },
    { key: "contract_end", label: "계약 종료일" },
    { key: "progress", label: "진행 상태" },
    { key: "maintenance", label: "유지보수 여부" },
  ],
  security: [
    { key: "incident_no", label: "Incident No" },
    { key: "company_id", label: "Company ID" },
    { key: "threat_type", label: "위협 유형" },
    { key: "risk_level", label: "위험 등급" },
    { key: "server_type", label: "서버 종류" },
    { key: "incident_date", label: "사건 일자" },
    { key: "handled_date", label: "처리 일자" },
    { key: "status", label: "상태" },
    { key: "action", label: "조치" },
    { key: "handler_count", label: "처리 인원 수" },
  ],
};