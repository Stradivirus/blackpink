import React, { useEffect, useState } from "react";
import { API_URLS } from "../../../api/urls";
import {
  planColors,
  riskColors,
  osColors,
  securityOrder,
  bizPlanKeys,
  secLevelKeys
} from "../../../constants/dataconfig";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// TeamInfoPanels를 별도 export
export const TeamInfoPanels: React.FC<{ summary: any }> = ({ summary }) => {
  return (
    <div className="team-info-panels">
      <div className="team-info-panel">
        <div className="team-info-title">가입자 수</div>
        <div className="team-info-value">
          {summary?.biz ? (Object.values(summary.biz) as number[]).reduce((a, b) => a + b, 0) : 0}
        </div>
        {summary?.biz && (
          <div style={{ fontSize: '0.95rem', marginTop: 8 }}>
            {Object.entries(summary.biz).map(([plan, cnt]: any) => (
              <div key={plan} style={{ color: planColors[plan] || "#764ba2" }}>
                {plan}: {cnt}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="team-info-panel">
        <div className="team-info-title">진행 중인 프로젝트</div>
        <div className="team-info-value">{summary?.dev?.total ?? 0}</div>
        {summary?.dev?.os && (
          <div style={{ fontSize: '0.95rem', marginTop: 8 }}>
            {Object.entries(summary.dev.os).map(([os, cnt]: any) => (
              <div key={os} style={{ color: osColors[os] || "#764ba2" }}>
                {os}: {cnt}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="team-info-panel">
        <div className="team-info-title">보안사고</div>
        <div className="team-info-value">
          {summary?.security ? (Object.values(summary.security) as number[]).reduce((a, b) => a + b, 0) : 0}
        </div>
        {summary?.security && (
          <div style={{ fontSize: '0.95rem', marginTop: 8 }}>
            {securityOrder
              .filter(level => summary.security[level])
              .map(level => (
                <div key={level} style={{ color: planColors[level] || "#764ba2" }}>
                  {level}: {summary.security[level]}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardSummaryGraphs: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(API_URLS.DASHBOARD_SUMMARY_GRAPHS)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{marginTop:32, fontSize:'1.2rem'}}>그래프 로딩중...</div>;
  if (!data) return null;

  // summary 데이터 선언 (return문 위에서)
  const summary = data.summary;

  // 사업팀 그래프 데이터 (중복 데이터 dash 적용)
  const bizAllDataArr = bizPlanKeys.map(plan => data.biz[plan].map((v: number) => Math.round(v)));
  const bizDataStrArr = bizAllDataArr.map(arr => JSON.stringify(arr));
  const bizGroupMap: Record<string, number[]> = {};
  bizDataStrArr.forEach((str, idx) => {
    if (!bizGroupMap[str]) bizGroupMap[str] = [];
    bizGroupMap[str].push(idx);
  });
  const bizChartData = {
    labels: data.biz.labels,
    datasets: bizPlanKeys.map((plan, idx) => {
      const group = bizGroupMap[bizDataStrArr[idx]];
      const isDuplicated = group.length > 1;
      let borderDash, borderDashOffset;
      if (isDuplicated) {
        borderDash = [6, 6];
        borderDashOffset = group.indexOf(idx) * 6;
      }
      return {
        label: plan,
        data: bizAllDataArr[idx],
        borderColor: planColors[plan],
        backgroundColor: planColors[plan],
        tension: 0.3,
        borderDash,
        borderDashOffset
      };
    })
  };
  // 개발팀 그래프 데이터
  const devOsKeys = Object.keys(data.dev).filter(key => key !== "labels");
  const allDataArr = devOsKeys.map(os => data.dev[os].map((v: number) => Math.round(v)));
  const dataStrArr = allDataArr.map(arr => JSON.stringify(arr));
  const groupMap: Record<string, number[]> = {};
  dataStrArr.forEach((str, idx) => {
    if (!groupMap[str]) groupMap[str] = [];
    groupMap[str].push(idx);
  });

  const devChartData = {
    labels: data.dev.labels,
    datasets: devOsKeys.map((os, idx) => {
      const group = groupMap[dataStrArr[idx]];
      const isDuplicated = group.length > 1;
      // 중복된 데이터 그룹 내에서 각 라인마다 dash offset 다르게 적용
      let borderDash, borderDashOffset;
      if (isDuplicated) {
        borderDash = [6, 6];
        // 그룹 내에서 순서대로 offset 다르게 (예: 0, 6, 12...)
        borderDashOffset = group.indexOf(idx) * 6;
      }
      return {
        label: os,
        data: allDataArr[idx],
        borderColor: osColors[os] || "#764ba2",
        backgroundColor: osColors[os] || "#764ba2",
        tension: 0.3,
        borderDash,
        borderDashOffset
      };
    })
  };
  // 보안팀 그래프 데이터 (중복 데이터 dash 적용)
  const secAllDataArr = secLevelKeys.map(level => data.security[level].map((v: number) => Math.round(v)));
  const secDataStrArr = secAllDataArr.map(arr => JSON.stringify(arr));
  const secGroupMap: Record<string, number[]> = {};
  secDataStrArr.forEach((str, idx) => {
    if (!secGroupMap[str]) secGroupMap[str] = [];
    secGroupMap[str].push(idx);
  });
  const securityChartData = {
    labels: data.security.labels,
    datasets: secLevelKeys.map((level, idx) => {
      const group = secGroupMap[secDataStrArr[idx]];
      const isDuplicated = group.length > 1;
      let borderDash, borderDashOffset;
      if (isDuplicated) {
        borderDash = [6, 6];
        borderDashOffset = group.indexOf(idx) * 6;
      }
      return {
        label: level,
        data: secAllDataArr[idx],
        borderColor: riskColors[level],
        backgroundColor: riskColors[level],
        tension: 0.3,
        borderDash,
        borderDashOffset
      };
    })
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: false }
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
      {/* 요약(서머리) 카드가 위쪽 */}
      {summary && (
        <div style={{ display: "flex", justifyContent: "center", gap: 24, margin: "40px 0 32px 0" }}>
          <div className="dashboard-summary-card">
            <div className="dashboard-summary-label">가입자 수</div>
            <div className="dashboard-summary-number">{summary.totalMembers}</div>
            <div className="dashboard-summary-sub">
              <span style={{ color: planColors["베이직"] }}>베이직: {summary.basic}</span><br/>
              <span style={{ color: planColors["엔터프라이즈"] }}>엔터프라이즈: {summary.enterprise}</span><br/>
              <span style={{ color: planColors["프로"] }}>프로: {summary.pro}</span>
            </div>
          </div>
          <div className="dashboard-summary-card">
            <div className="dashboard-summary-label">진행 중인 프로젝트</div>
            <div className="dashboard-summary-number">{summary.totalProjects}</div>
            <div className="dashboard-summary-sub">
              <span style={{ color: osColors[3] }}>Android: {summary.android}</span>&nbsp;
              <span style={{ color: osColors[1] }}>iOS: {summary.ios}</span><br/>
              <span style={{ color: osColors[2] }}>Linux: {summary.linux}</span>&nbsp;
              <span style={{ color: osColors[5] }}>Windows: {summary.windows}</span>&nbsp;
              <span style={{ color: osColors[0] }}>macOS: {summary.macos}</span>
            </div>
          </div>
          <div className="dashboard-summary-card">
            <div className="dashboard-summary-label">보안사고</div>
            <div className="dashboard-summary-number">{summary.totalIncidents}</div>
            <div className="dashboard-summary-sub">
              <span style={{ color: riskColors.LOW }}>LOW: {summary.low}</span><br/>
              <span style={{ color: riskColors.MEDIUM }}>MEDIUM: {summary.medium}</span><br/>
              <span style={{ color: riskColors.HIGH }}>HIGH: {summary.high}</span>
            </div>
          </div>
        </div>
      )}
      {/* 그래프 카드가 아래쪽 */}
      <div className="dashboard-graph-container">
        <div className="dashboard-graph-card">
          <div style={{ fontWeight: 600, marginBottom: 8, color: planColors["베이직"] }}>사업팀 가입자 증감</div>
          <Line data={bizChartData} options={options} />
        </div>
        <div className="dashboard-graph-card">
          <div style={{ fontWeight: 600, marginBottom: 8, color: osColors[5] }}>개발팀 프로젝트 증감</div>
          <Line data={devChartData} options={options} />
        </div>
        <div className="dashboard-graph-card">
          <div style={{ fontWeight: 600, marginBottom: 8, color: riskColors.HIGH }}>보안팀 사고 증감</div>
          <Line data={securityChartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default DashboardSummaryGraphs;
