// src/pages/Admin/AdminDataPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URLS } from "../../api/urls";
import { teamList, columnsByTeam } from "../../constants/dataconfig";
import AdminDataTable from "../../components/Admin/AdminDataTable";
import type { TeamData } from "../../types/CompanyData";
import "../../styles/AdminDataPage.css";

const AdminDataPage: React.FC = () => {
  const [data, setData] = useState<TeamData[]>([]); // 테이블 데이터
  const [loading, setLoading] = useState(true);     // 로딩 상태

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  // 선택된 팀 (기본: security)
  const selectedTeam = (params.get("team") as "biz" | "dev" | "security") || "security";

  // 데이터 fetch 함수
  const fetchData = useCallback(() => {
    // 잘못된 팀이면 security로 리다이렉트
    if (!teamList.some((t) => t.key === selectedTeam)) {
      navigate("/admin/data?team=security", { replace: true });
      return;
    }

    setLoading(true);

    // 팀별 API URL 선택
    let fetchUrl = "";
    switch (selectedTeam) {
      case "biz":
        fetchUrl = API_URLS.BIZ;
        break;
      case "dev":
        fetchUrl = API_URLS.DEV;
        break;
      case "security":
        fetchUrl = API_URLS.SECURITY;
        break;
      default:
        setLoading(false);
        return;
    }

    // 데이터 요청 및 정렬
    fetch(fetchUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((res) => {
        let result = [];
        if (selectedTeam === "security") {
          result = res.incidents || [];
        } else if (selectedTeam === "biz") {
          result = res.biz || [];
        } else if (selectedTeam === "dev") {
          result = res.dev || [];
        }

        // 팀별 기준 날짜 컬럼명
        const dateKey = selectedTeam === "biz"
          ? "contract_start"
          : selectedTeam === "dev"
            ? "start_date"
            : "incident_date";

        // 최신순(내림차순) 정렬
        (result as TeamData[]).sort((a, b) => {
          const aDate = (a as any)[dateKey] || "";
          const bDate = (b as any)[dateKey] || "";
          return bDate.localeCompare(aDate);
        });

        setData(result);
      })
      .catch((error) => {
        console.error("데이터 로딩 중 오류 발생:", error);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [selectedTeam, navigate]);

  // 팀 변경/마운트 시 데이터 로딩
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 팀별 컬럼/라벨
  const columns = columnsByTeam[selectedTeam] || [];
  const currentTeamLabel = teamList.find((t) => t.key === selectedTeam)?.label || "알 수 없는 팀";

  return (
    <div style={{ padding: "2rem" }}>
      <AdminDataTable
        data={data}
        columns={columns}
        loading={loading}
        selectedTeam={selectedTeam}
        selectedTeamLabel={currentTeamLabel}
        fetchData={fetchData} // 등록/수정 후 리로딩용 함수 전달
      />
    </div>
  );
};

export default AdminDataPage;
