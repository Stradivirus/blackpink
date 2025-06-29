import React, { useState, useEffect } from "react";
import { API_URLS } from "../../api/urls";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  fontWeight: 700,
  borderBottom: "2px solid #eee",
  background: "#f7f7f7",
};

const tdStyle: React.CSSProperties = {
  padding: "7px 10px",
  textAlign: "center",
};

const KOREA_LABELS = ["Korea (Republic of)", "South Korea", "대한민국"];

function getBarColors(data: any[], baseColor: string, highlightColor: string) {
  return data.map(row =>
    KOREA_LABELS.includes(row.country) ? highlightColor : baseColor
  );
}

const GRAPH_MODES = [
  {
    label: "사이버 보안 지수 높은 순",
    sort: (a: any, b: any) => b.security_index - a.security_index,
    getData: (data: any[]) => ({
      labels: data.map((row) => row.country),
      datasets: [
        {
          label: "사이버 보안 지수",
          data: data.map((row) => row.security_index),
          backgroundColor: getBarColors(data, "#00ffe7", "#ff3b3b"),
        },
      ],
    }),
  },
  {
    label: "디지털 생활 수준 높은 순",
    sort: (a: any, b: any) => b.digital_level - a.digital_level,
    getData: (data: any[]) => ({
      labels: data.map((row) => row.country),
      datasets: [
        {
          label: "디지털 생활 수준",
          data: data.map((row) => row.digital_level),
          backgroundColor: getBarColors(data, "#ffb347", "#ff3b3b"),
        },
      ],
    }),
  },
  {
    label: "지수 차이(보안-디지털) 높은 순",
    sort: (a: any, b: any) => b.difference - a.difference,
    getData: (data: any[]) => ({
      labels: data.map((row) => row.country),
      datasets: [
        {
          label: "지수 차이(보안-디지털)",
          data: data.map((row) => row.difference),
          // 기본색은 주황, 한국만 빨강
          backgroundColor: getBarColors(data, "#00ffe7", "#ff3b3b"),
        },
      ],
    }),
  },
];

const DISPLAY_MODES = [
  { type: "table", label: "NCSI 순위 테이블" },
  ...GRAPH_MODES.map((g) => ({ type: "graph", label: g.label })),
];

const NcsiDashboard: React.FC = () => {
  const [ncsi, setNcsi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayIdx, setDisplayIdx] = useState(0);

  useEffect(() => {
    fetch(API_URLS.NCSI_TOP20)
      .then((res) => res.json())
      .then((data) => {
        setNcsi(data.results || []);
        setLoading(false);
      });
  }, []);

  // 8초마다 표/그래프 순환
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayIdx((idx) => (idx + 1) % DISPLAY_MODES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const countryCount = ncsi.length;
  const avgSecurity = ncsi.length
    ? (ncsi.reduce((sum, row) => sum + (row.security_index || 0), 0) / ncsi.length).toFixed(2)
    : "-";
  const avgDigital = ncsi.length
    ? (ncsi.reduce((sum, row) => sum + (row.digital_level || 0), 0) / ncsi.length).toFixed(2)
    : "-";

  const summaryCardStyle: React.CSSProperties = {
    background: "rgba(30, 40, 55, 0.95)",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.7)",
    padding: "1rem 0",
    minWidth: 0,
    flex: 1,
    color: "#fff",
    border: "1.5px solid #00ffe7",
    marginBottom: "2rem",
    textAlign: "center",
  };

  // 한국 정보 추출
  const koreaIdx = ncsi.findIndex(row => KOREA_LABELS.includes(row.country));
  const korea = koreaIdx !== -1 ? ncsi[koreaIdx] : null;
  const koreaRank = koreaIdx !== -1 ? koreaIdx + 1 : "-";
  const koreaScore = korea ? korea.security_index : "-";

  // 표/그래프 데이터 준비
  let content = null;
  if (DISPLAY_MODES[displayIdx].type === "table") {
    // 표는 기본 security_index 내림차순(혹은 원하는 정렬)
    const sorted = [...ncsi].sort(GRAPH_MODES[0].sort);
    content = (
      <>
        <h3 style={{ fontWeight: 700, fontSize: 22, margin: "0 0 12px", color: "#222" }}>
          NCSI 순위 테이블
        </h3>
        <div style={{
          overflowX: "auto",
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          padding: 12,
          marginBottom: 0
        }}>
          <div style={{ maxHeight: 550, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
              <thead>
                <tr style={{ background: "#f7f7f7" }}>
                  <th style={thStyle}>순위</th>
                  <th style={thStyle}>국가</th>
                  <th style={thStyle}>사이버 보안 지수</th>
                  <th style={thStyle}>디지털 생활 수준</th>
                  <th style={thStyle}>지수 차이</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, idx) => (
                  <tr key={row.country} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={tdStyle}>{row.country}</td>
                    <td style={tdStyle}>{row.security_index}</td>
                    <td style={tdStyle}>{row.digital_level}</td>
                    <td style={tdStyle}>{row.difference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  } else {
    // 그래프 모드일 때만 graphIdx 계산
    const graphIdx = displayIdx - 1; // DISPLAY_MODES[0]이 table이므로 -1
    const sorted = [...ncsi].sort(GRAPH_MODES[graphIdx].sort);
    const chartData = GRAPH_MODES[graphIdx].getData(sorted);
    content = (
      <>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12, color: "#222" }}>
          {GRAPH_MODES[graphIdx].label}
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center" }}>Loading...</div>
        ) : (
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
              },
              scales: {
                x: { ticks: { color: "#222" } },
                y: { ticks: { color: "#222" } },
              },
            }}
            height={200}
          />
        )}
      </>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24, color: "#fff" }}>
        <span role="img" aria-label="지표">📊</span> NCSI(National Cyber Security Index) 주요 지표 요약
      </h2>
      {/* 1단: 전체 요약 */}
      <div style={{
        display: "flex",
        gap: 24,
        marginBottom: 12,
        width: "100%",
      }}>
        <div style={summaryCardStyle}>
          <div style={{ color: "#bbb", fontSize: 16, marginBottom: 8 }}>총 국가 수</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{countryCount}개국</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ color: "#bbb", fontSize: 16, marginBottom: 8 }}>평균 사이버 보안 지수</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{avgSecurity}점</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ color: "#bbb", fontSize: 16, marginBottom: 8 }}>평균 디지털 생활 수준</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{avgDigital}점</div>
        </div>
      </div>
      {/* 2단: 한국 정보 */}
      <div style={{
        display: "flex",
        gap: 24,
        marginBottom: 32,
        width: "100%",
      }}>
        <div style={summaryCardStyle}>
          <div style={{ color: "#bbb", fontSize: 16, marginBottom: 8 }}>한국 순위</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{koreaRank}위</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ color: "#bbb", fontSize: 16, marginBottom: 8 }}>한국 보안지수</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{koreaScore}점</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ color: "#bbb", fontSize: 16, marginBottom: 8 }}>한국 디지털 생활 수준</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {korea ? korea.digital_level : "-"}점
          </div>
        </div>
      </div>
      {/* 이하 동일 */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, marginBottom: 32 }}>
        {DISPLAY_MODES[displayIdx].type === "graph" ? (
          React.cloneElement(content as React.ReactElement)
        ) : (
          content
        )}
      </div>
      <div style={{ fontSize: 14, color: "#888", marginTop: 16 }}>
        데이터 출처:{" "}
        <a
          href="https://ncsi.ega.ee/ncsi-index/?order=rank"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#00ffe7", textDecoration: "underline" }}
        >
          National Cyber Security Index (NCSI)
        </a>
      </div>
    </div>
  );
};

export default NcsiDashboard;