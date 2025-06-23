// src/constants/dataConfig.ts

// 팀 정의
export const teamList = [
  { key: "biz", label: "사업팀" },
  { key: "dev", label: "개발팀" },
  { key: "security", label: "보안팀" },
];

export const threatTypes = [
  "악성코드",
  "해킹공격",
  "피싱",
  "랜섬웨어",
  "DDoS",
  "웹취약점",
  "자격증명 탈취",
  "메시지 가로채기",
];

// 보안팀 그래프 타입 정의
export const securityGraphTypes = [
  { type: "threat_m", label: "월별 침해 현황" },
  { type: "threat", label: "위협 유형 분포" },
  { type: "risk", label: "위험 등급 비율" },
  { type: "threat_y", label: "연도별 침해 현황" },
  { type: "processed_threats", label: "처리된 위협 종류" },
  { type: "correl_threats_server", label: "서버별 위협 발생(Heatmap)" },
  { type: "correl_risk_status", label: "위협 등급별 처리 현황" },
  { type: "correl_threat_action", label: "위협 유형과 조치 방법" },
  { type: "correl_threat_handler", label: "위협 유형별 필요 인원" },
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
    { key: "company_id", label: "회사명" }, // 기존: label: "company_id"
    { key: "os", label: "OS" },
    { key: "os_version", label: "OS 버전" },
    { key: "dev_start_date", label: "개발 시작일" },
    { key: "dev_end_date", label: "개발 종료일" },
    { key: "contract_end", label: "계약 종료일" },
    { key: "progress", label: "진행 상태" },
    { key: "maintenance", label: "유지보수 여부" },
  ],
  security: [
    { key: "company_id", label: "회사명" }, // 기존: label: "company_id"
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

// 팀별 날짜 필터용 컬럼 정보 정의
export const dateColumnsByTeam: {
  [team: string]: { key: string; label: string }[];
} = {
  security: [
    { key: "incident_date", label: "사건일자" },
    { key: "handled_date", label: "처리일자" },
  ],
  biz: [
    { key: "contract_start", label: "계약 시작일" },
    { key: "contract_end", label: "계약 종료일" },
  ],
  dev: [
    { key: "dev_start_date", label: "개발 시작일" },
    { key: "dev_end_date", label: "개발 종료일" },
  ],
};

// OS에 따른 버전 맵
export const osVersionMap: Record<string, string[]> = {
  Windows: ["7", "8", "10", "11"],
  Linux: ["Rocky 8", "Rocky 9", "Ubuntu 18.04", "Ubuntu 20.04", "Ubuntu 22.04"],
  Android: ["10", "11", "12", "13"],
  iOS: ["15", "16", "17"],
  macOS: ["11", "12", "13", "14"],
};