import * as React from "react";
import { GRAPH_API } from "../../api/urls";

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
          src={`${GRAPH_API}/${g.type}`}
          alt={g.label}
          style={{
            width: "100%",
            maxWidth: 480,
            border: "1px solid #eee",
            borderRadius: 8,
            background: "#fafafa",
          }}
        />
      </div>
    ))}
  </div>
);

export default TeamGraphs;