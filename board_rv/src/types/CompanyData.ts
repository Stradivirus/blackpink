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
    os: string;
    os_version: string;
    dev_start_date: string;
    dev_end_date: string; 
    progress: string;
    maintenance: string;
};

export interface Incident {
  incident_no: number;
  company_id: string;
  threat_type: string;
  risk_level: string;
  server_type: string;
  incident_date: string;
  handled_date?: string | null;
  status: string;
  action: string;
  handler_count: number;
}

export interface IncidentListResponse {
  incidents: Incident[];
}
