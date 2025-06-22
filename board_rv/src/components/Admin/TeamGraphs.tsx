import * as React from "react";
import { API_URLS } from "../../api/urls";

export type GraphType = {
  type: string;
  label: string;
};

type TeamGraphsProps = {
  graphTypes: GraphType[];
};

const TeamGraphs: React.FC<TeamGraphsProps> = ({ graphTypes }) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 32 }}>
    {graphTypes.map((g) => (
      <div key={g.type} style={{ minWidth: 350, maxWidth: 500 }}>
        <h4>{g.label}</h4>
        <img
          src={`${API_URLS.GRAPH}/${g.type}`}
          alt={g.label}
          style={{
            width: "100%",
            maxWidth: 480,
            borderTop: "1px solid #eee",
            borderRight: "1px solid #eee",
            borderLeft: "1px solid #eee",
            borderBottom: "2px solid #333",
            borderRadius: 8,
            background: "#fafafa",
          }}
        />
      </div>
    ))}
  </div>
);

export default TeamGraphs;