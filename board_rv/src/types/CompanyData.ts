export interface Companies {
    id: string;
    company_id: string;
    company_name: string;
    industry: string;
    plan: string;
    contract_start: string; 
    contract_end: string;
    status: string;
    manager_name: string;
    manager_phone: string;
};

export interface Dev {
    id: string;
    company_id: string;
    company_name: string;
    os: string;
    os_versions: string;
    start_date: string;
    end_date: string;
    end_date_fin?: string | null;
    dev_days: number;
    dev_status: string; 
    maintenance?: string | null;
    error?: string | null;
    handler_count: number;
    manager_name?: string;      // 담당자명 추가
};

export interface Incident {
  incident_no: number;
  company_id: string;
  company_name: string;
  threat_type: string;
  risk_level: string;
  server_type: string;
  incident_date: string;
  handled_date?: string | null;
  status: string;
  action: string;
  manager_name?: string;
  handler_count: number;
}

export interface IncidentListResponse {
  incidents: Incident[];
}

export type TeamData = Companies | Dev | Incident;
