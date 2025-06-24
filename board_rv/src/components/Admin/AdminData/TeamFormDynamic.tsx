import React from "react";
import BizFormDynamic from "./BizFormDynamic";
import SecurityFormDynamic from "./SecurityFormDynamic";
import DevFormDynamic from "./DevFormDynamic";

interface TeamFormDynamicProps {
  team: string;
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const TeamFormDynamic: React.FC<TeamFormDynamicProps> = ({ team, initialData, onChange }) => {
  if (team === "biz") {
    return <BizFormDynamic initialData={initialData} onChange={onChange} />;
  }
  if (team === "security") {
    return <SecurityFormDynamic initialData={initialData} onChange={onChange} />;
  }
  if (team === "dev") {
    return <DevFormDynamic initialData={initialData} onChange={onChange} />;
  }
  return null;
};

export default TeamFormDynamic;
