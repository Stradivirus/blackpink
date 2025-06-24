import React, { useEffect, useState } from "react";
import type { GCIRanking } from "../../types/Dashboard";
import { API_URLS } from "../../api/urls";

const GCIRankingPanel: React.FC = () => {
  const [rankings, setRankings] = useState<GCIRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URLS.GCI_RANKINGS)
      .then(res => res.json())
      .then(data => setRankings(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel admin-table-panel" style={{ flex: 1, minWidth: 320 }}>
      <h2 className="text-2xl font-semibold mb-2">GCI 사이버보안 순위</h2>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table className="min-w-full text-center">
          <thead>
            <tr>
              <th>순위</th>
              <th>국가</th>
              <th>점수</th>
              <th>연도</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map(r => (
              <tr key={r.country + r.year}>
                <td>{r.rank}</td>
                <td>{r.country}</td>
                <td>{r.score}</td>
                <td>{r.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-gray-400 mt-2">
        ※ 순위가 낮을수록(1위에 가까울수록) 사이버보안 수준이 높음을 의미합니다.
      </p>
    </div>
  );
};

export default GCIRankingPanel;