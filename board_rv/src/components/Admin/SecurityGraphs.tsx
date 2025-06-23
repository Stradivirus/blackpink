import * as React from "react";
import { API_URLS } from "../../api/urls";
import { threatTypes } from "../../constants/dataconfig";

export type GraphType = {
  type: string;
  label: string;
};

type TeamGraphsProps = {
  graphTypes: GraphType[];
};



const ThreatMGraph: React.FC = () => {
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % threatTypes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentType = threatTypes[idx];


  return (
    <div>
      <h4>{currentType} 월별 침해 현황</h4>
      <img
        src={`${API_URLS.GRAPH}/threat_m?threat_type=${encodeURIComponent(
          currentType
        )}`}
        alt={currentType}
        style={{ minWidth: 350, maxWidth: 500 }}
      />
    </div>
  );
};

const TeamGraphs: React.FC<TeamGraphsProps> = ({ graphTypes }) => {
  return (
    <div className="admin-correlation-grid">
      {graphTypes.map((g) =>
        g.type === "threat_m" ? (
          <div
            key={g.type}
            className="admin-card admin-correlation-card"
            style={{ minWidth: 350, maxWidth: 500 }}
          >
            <ThreatMGraph />
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