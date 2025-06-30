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

// 각 팀별 컬럼 정의
export const columnsByTeam: Record<string, { key: string; label: string }[]> = {
  biz: [
    { key: "company_id", label: "회사코드" }, // 기존 label : "company_id" > "회사코드"
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
    { key: "company_id", label: "회사 코드" },
    { key: "company_name", label: "회사명" },
    { key: "os", label: "운영체제" },
    { key: "os_versions", label: "OS 버전" },
    { key: "start_date", label: "시작일" },
    { key: "end_date_fin", label: "최종 종료일" },
    { key: "dev_status", label: "상태" },
    { key: "maintenance", label: "유지보수" },
    { key: "error", label: "에러" },
    { key: "manager_name", label: "담당자명" },
    { key: "handler_count", label: "담당자 수" },
  ],
  security: [
    { key: "company_id", label: "회사코드" },
    { key: "company_name", label: "회사명" }, // ← 이 줄 추가!
    { key: "threat_type", label: "위협 유형" },
    { key: "risk_level", label: "위험 등급" },
    { key: "server_type", label: "서버 종류" },
    { key: "incident_date", label: "사건 일자" },
    { key: "handled_date", label: "처리 일자" },
    { key: "status", label: "상태" },
    { key: "action", label: "조치" },
    { key: "manager_name", label: "담당자명" },
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
    { key: "start_date", label: "시작일" },
    { key: "end_date_fin", label: "최종 종료일" },
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

// 팀명 매핑 객체 추가 (dataconfig에 없으므로 직접 추가)
export const teamLabelMap: Record<string, string> = {
  "보안팀": "보안팀",
  "개발팀": "개발팀",
  "사업팀": "사업팀",
  "관리팀": "관리팀",
  // 필요시 추가
};

export const serverTypes = [
  "웹서버", "DB서버", "애플리케이션서버", "인증서버"
];

export const actions = [
  "ip 차단", "패치적용", "계정잠금", "백업복구", "접근제어 강화",
  "모니터링 강화", "보안 교육 실시", "방화벽 설정"
];

export const statusOptions = {
  biz: ["진행중", "만료", "해지"],
  dev: ["개발 예정", "개발 진행중", "개발 중지", "개발 완료"],
  security: ["진행중", "처리완료"],
};

export const selectOptions: Record<string, string[]> = {
  plan: ["베이직", "프로", "엔터프라이즈"],
  status: [], // 기본값은 빈 배열, 실제 렌더링 시 team에 따라 동적으로 할당
  industry: ["IT", "금융", "제조", "유통"],
  risk_level: ["LOW", "MEDIUM", "HIGH"],
  threat_type: threatTypes,
  server_type: serverTypes,
  action: actions,
  maintenance: ["정상 운영중", "점검 예정", "점검 진행중", "장애 발생"],
  error: ["에러 없음", "서버 에러", "외부 에러", "네트워크 에러", "데이터베이스 에러", "클라이언트 에러"],
  // 필요시 추가
};

export const industryPrefixMap: Record<string, string> = {
  IT: "I",
  제조: "M",
  금융: "F",
  유통: "D",
};


// 대시보드 데이터 타입 정의
// 컬러맵 및 데이터 키 상수 추가 (DashboardSummaryGraphs.tsx에서 이동)
export const planColors: Record<string, string> = {
  베이직: "#764ba2",
  프로: "#e67e22",
  엔터프라이즈: "#3498db",
  미지정: "#888"
};
export const riskColors: Record<string, string> = {
  LOW: "#3498db",
  MEDIUM: "#f1c40f",
  HIGH: "#e74c3c"
};
export const osColors: Record<string, string> = {
  Windows: "#3498db",
  Linux: "#f1c40f",
  macOS: "#9b59b6",
  Ios: "#e67e22",
  iOS: "#e67e22",
  Android: "#16a085",
  미지정: "#888"
};
export const securityOrder = ["LOW", "MEDIUM", "HIGH", "미지정"];
export const bizPlanKeys = ["베이직", "프로", "엔터프라이즈"] as const;
export const secLevelKeys = ["LOW", "MEDIUM", "HIGH"] as const;

// 사업팀 그래프 타입 정의 추가
export const businessGraphTypes = [
  { type: "bar", label: "수익 바 차트" },
  { type: "heatmap", label: "수익 히트맵" },
  { type: "annual_sales", label: "연도별 상위 7개 회사 매출" },
  { type: "company_plan_heatmap", label: "회사별 연매출로 보는 계약종류" },
  { type: "company_plan_donut_multi", label: "2023~2025년도 상위 10개 회사 계약종류별 비교" },
  { type: "terminated_duration", label: "완료된 계약의 계약종류별 계약기간" },
  { type: "suspended_plan", label: "해지된 계약의 계약종류 분석" },
];

// 시스템 개발 그래프 타입 정의 추가
export const sysDevGraphTypes = [
  { type: "os_version_by_os", label: "OS별 버전 분포" },
  { type: "maintenance_by_os", label: "OS별 관리 현황" },
  { type: "dev_duration_by_os", label: "OS별 개발기간" },
  { type: "error_by_os", label: "OS별 에러 유형 분포" },
  { type: "dev_by_handler", label: "담당 인원 수와 개발기간 관계" },
];

// 보안팀 그래프 타입 정의
export const securityGraphTypes = [
  { type: "threat_m", label: "월별 침해 현황" },
  { type: "manpower", label: "처리기간 vs 투입인원" },
  { type: "risk", label: "위험 등급 비율" },
  { type: "threat_y", label: "연도별 침해 현황" },
  { type: "processed_threats", label: "처리된 위협 종류" },
  { type: "correl_threats_server", label: "서버별 위협 발생(Heatmap)" },
  { type: "correl_risk_status", label: "위협 등급별 처리 현황" },
  { type: "correl_threat_action", label: "위협 유형과 조치 방법" },
  { type: "correl_threat_handler", label: "위협 유형별 필요 인원" },
];