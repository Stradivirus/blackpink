import * as React from "react";
import { API_URLS } from "../../api/urls";
// import "../../styles/admindashboard.css";

export type GraphType = {
  type: string;
  label: string;
};

type TeamGraphsProps = {
  graphTypes: GraphType[];
};

const TeamGraphs: React.FC<TeamGraphsProps> = ({ graphTypes }) => {
  const [topThreats, setTopThreats] = React.useState<string[]>([]);
  const [selectedThreat, setSelectedThreat] = React.useState<string>("");
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    // top 5 위협 유형을 백엔드에서 받아옴
    fetch(`${API_URLS.GRAPH}/top_threats`)
      .then((res) => res.json())
      .then((data) => {
        setTopThreats(data.top_threats || []);
        setSelectedThreat(data.top_threats?.[0] || "");
      });
  }, []);

  return (
    <div className="admin-correlation-grid">
      {graphTypes.map((g) =>
        g.type === "threat_m" ? (
          <div
            key={g.type}
            className="admin-card admin-correlation-card"
            style={{ minWidth: 350, maxWidth: 500 }}
          >
            <h4 className="admin-card-title">{g.label}</h4>
            <div style={{ marginBottom: 8 }}>
              {topThreats.map((t) => (
                <button
                  key={t}
                  className={
                    selectedThreat === t
                      ? "admin-tab-selected"
                      : "admin-tab"
                  }
                  onClick={() => {
                    setSelectedThreat(t);
                    setImgError(false);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {selectedThreat && !imgError && (
              <div className="admin-image-container">
                <img
                  src={`${API_URLS.GRAPH}/threat_m/${selectedThreat}`}
                  alt={selectedThreat}
                  onError={() => setImgError(true)}
                />
              </div>
            )}
            {imgError && (
              <div
                style={{
                  color: "red",
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                그래프 데이터를 불러올 수 없습니다.
              </div>
            )}
          </div>
        ) : (
          <div
            key={g.type}
            className="admin-card admin-correlation-card"
            style={{ minWidth: 350, maxWidth: 500 }}
          >
            <h4 className="admin-card-title">{g.label}</h4>
            <div className="admin-image-container">
              <img
                src={`${API_URLS.GRAPH}/${g.type}`}
                alt={g.label}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default TeamGraphs;