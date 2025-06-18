export interface Incident {
  incident_no: number;
  company_id: string;
  threat_type: string;
  risk_level: string;
  server_type: string;
  incident_date: string;
  handled_date: string | null;
  status: string;
  action: string;
  handler_count: number;
}

export interface IncidentListResponse {
  incidents: Incident[];
}