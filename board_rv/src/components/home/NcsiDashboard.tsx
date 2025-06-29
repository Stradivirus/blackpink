import React, { useState, useEffect } from "react";
import { API_URLS } from "../../api/urls";

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

const NcsiDashboard: React.FC = () => {
  const [ncsi, setNcsi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URLS.NCSI_TOP20)
      .then(res => res.json())
      .then(data => {
        setNcsi(data.results || []);
        setLoading(false);
      });
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
    padding: "1.5rem 0", // ← 세로길이(상하 패딩) 조절
    minWidth: 0,
    flex: 1,
    color: "#fff",
    border: "1.5px solid #00ffe7",
    marginBottom: "2rem",
    textAlign: "center",
  };

  return (
    <div style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24, color: "#fff" }}>
        <span role="img" aria-label="지표">📊</span> NCSI(National Cyber Security Index) 주요 지표 요약
      </h2>
      <div style={{
        display: "flex",
        gap: 24,
        marginBottom: 32,
        width: "100%",
      }}>
        <div style={summaryCardStyle}>
          <div style={{ color: "#bbb", fontSize: 16, marginBottom: 8 }}>총 국가 수</div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{countryCount}개국</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ color: "#bbb", fontSize: 16, marginBottom: 8 }}>평균 사이버 보안 지수</div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{avgSecurity}점</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ color: "#bbb", fontSize: 16, marginBottom: 8 }}>평균 디지털 생활 수준</div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{avgDigital}점</div>
        </div>
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 22, margin: "32px 0 12px", color: "#fff" }}>
        <span role="img" aria-label="순위">📋</span> NCSI 순위 테이블
      </h3>
      <div style={{
        overflowX: "auto",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        padding: 12,
        marginBottom: 24
      }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr style={{ background: "#f7f7f7" }}>
                <th style={thStyle} title="rank: NCSI 순위 (낮을수록 좋음)">순위</th>
                <th style={thStyle} title="country: 국가명">국가</th>
                <th style={thStyle} title="security_index: 사이버 보안 지수 (높을수록 좋음)">사이버 보안 지수</th>
                <th style={thStyle} title="digital_level: 디지털 생활 수준 지수 (높을수록 좋음)">디지털 생활 수준</th>
                <th style={thStyle} title="difference: 보안지수-디지털수준 (양수: 보안↑, 음수: 디지털화↑)">지수 차이</th>
              </tr>
            </thead>
            <tbody>
              {ncsi.map((row, idx) => (
                <tr key={row.country} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={tdStyle}>{row.rank}</td>
                  <td style={tdStyle}>{row.country}</td>
                  <td style={tdStyle}>{row.security_index}</td>
                  <td style={tdStyle}>{row.digital_level}</td>
                  <td style={tdStyle}>{row.difference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ fontSize: 14, color: "#888", marginTop: 16 }}>
        데이터 출처:{" "}
        <a
          href="https://ncsi.ega.ee/ncsi-index/?order=rank"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#00ffe7", textDecoration: "underline" }} // 보기 좋은 색상
        >
          National Cyber Security Index (NCSI)
        </a>
      </div>
    </div>
  );
};

export default NcsiDashboard;