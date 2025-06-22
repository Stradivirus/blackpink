// src/pages/Admin/AdminDataPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URLS } from "../../api/urls";
import { teamList, columnsByTeam } from "../../constants/dataconfig";
import AdminDataTable from "../../components/Admin/AdminDataTable";
import "../../styles/AdminDataPage.css";

const AdminDataPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const selectedTeam = params.get("team") || "security";

  useEffect(() => {
    if (!teamList.some((t) => t.key === selectedTeam)) {
      navigate("/admin/data?team=security", { replace: true });
      return;
    }

    setLoading(true);

    let fetchUrl = "";
    switch (selectedTeam) {
      case "biz":
        fetchUrl = API_URLS.COMPANIES;
        break;
      case "dev":
        fetchUrl = API_URLS.DEV;
        break;
      case "security":
        fetchUrl = API_URLS.INCIDENT;
        break;
      default:
        setLoading(false);
        return;
    }

    fetch(fetchUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((res) => {
        let result = [];

        if (selectedTeam === "security") {
          result = res.incidents || [];
        } else if (selectedTeam === "biz") {
          result = res.companies || [];
        } else if (selectedTeam === "dev") {
          result = res.dev || [];
        }

        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error("데이터 로딩 중 오류 발생:", error);
        setData([]);
        setLoading(false);
      });
  }, [selectedTeam, navigate]);

  const columns = columnsByTeam[selectedTeam] || [];
  const currentTeamLabel = teamList.find((t) => t.key === selectedTeam)?.label || "알 수 없는 팀";

  return (
    <div style={{ padding: "2rem" }}>
      <h1>데이터 관리</h1>

      <AdminDataTable
        data={data}
        columns={columns}
        loading={loading}
        selectedTeam={selectedTeam}
        selectedTeamLabel={currentTeamLabel}

      />
    </div>
  );
};

export default AdminDataPage;