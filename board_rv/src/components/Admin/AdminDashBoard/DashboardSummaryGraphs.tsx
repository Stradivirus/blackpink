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
                <div key={level} style={{ color: riskColors[level] || "#764ba2" }}>
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

  // 중복 dash 처리 함수
  function makeDashDatasets(
    keys: string[],
    allDataArr: number[][],
    colorMap: Record<string, string>,
    labelMap?: Record<string, string>
  ) {
    const dataStrArr = allDataArr.map(arr => JSON.stringify(arr));
    const groupMap: Record<string, number[]> = {};
    dataStrArr.forEach((str, idx) => {
      if (!groupMap[str]) groupMap[str] = [];
      groupMap[str].push(idx);
    });
    return keys.map((key, idx) => {
      const group = groupMap[dataStrArr[idx]];
      const isDuplicated = group.length > 1;
      let borderDash, borderDashOffset;
      if (isDuplicated) {
        borderDash = [6, 6];
        borderDashOffset = group.indexOf(idx) * 6;
      }
      return {
        label: labelMap?.[key] || key,
        data: allDataArr[idx],
        borderColor: colorMap[key] || "#764ba2",
        backgroundColor: colorMap[key] || "#764ba2",
        tension: 0.3,
        borderDash,
        borderDashOffset
      };
    });
  }

  // 사업팀 그래프 데이터
  const bizAllDataArr = bizPlanKeys.map(plan => data.biz[plan].map((v: number) => Math.round(v)));
  const bizChartData = {
    labels: data.biz.labels,
    datasets: makeDashDatasets(bizPlanKeys as unknown as string[], bizAllDataArr, planColors)
  };
  // 개발팀 그래프 데이터
  const devOsKeys = Object.keys(data.dev).filter(key => key !== "labels");
  const allDataArr = devOsKeys.map(os => data.dev[os].map((v: number) => Math.round(v)));
  const devChartData = {
    labels: data.dev.labels,
    datasets: makeDashDatasets(devOsKeys, allDataArr, osColors)
  };
  // 보안팀 그래프 데이터
  const secAllDataArr = secLevelKeys.map(level => data.security[level].map((v: number) => Math.round(v)));
  const securityChartData = {
    labels: data.security.labels,
    datasets: makeDashDatasets(secLevelKeys as unknown as string[], secAllDataArr, riskColors)
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false, // 그래프가 부모 높이에 맞게
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
              <span style={{ color: osColors["Android"] }}>Android: {summary.android}</span>&nbsp;
              <span style={{ color: osColors["iOS"] }}>iOS: {summary.ios}</span><br/>
              <span style={{ color: osColors["Linux"] }}>Linux: {summary.linux}</span>&nbsp;
              <span style={{ color: osColors["Windows"] }}>Windows: {summary.windows}</span>&nbsp;
              <span style={{ color: osColors["macOS"] }}>macOS: {summary.macos}</span>
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
          <div style={{width: '100%', height: '300px'}}>
            <Line data={bizChartData} options={options} />
          </div>
        </div>
        <div className="dashboard-graph-card">
          <div style={{ fontWeight: 600, marginBottom: 8, color: osColors[5] }}>개발팀 프로젝트 증감</div>
          <div style={{width: '100%', height: '300px'}}>
            <Line data={devChartData} options={options} />
          </div>
        </div>
        <div className="dashboard-graph-card">
          <div style={{ fontWeight: 600, marginBottom: 8, color: riskColors.HIGH }}>보안팀 사고 증감</div>
          <div style={{width: '100%', height: '300px'}}>
            <Line data={securityChartData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummaryGraphs;
