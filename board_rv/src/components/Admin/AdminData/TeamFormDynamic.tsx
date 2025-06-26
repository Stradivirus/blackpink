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
    return <BizFormDynamic initialData={initialData} onChange={(d) => onChange(d)} />;
  }
  if (team === "security") {
    return <SecurityFormDynamic initialData={initialData} onChange={(d) => onChange(d)} />;
  }
  if (team === "dev") {
    return <DevFormDynamic initialData={initialData} onChange={onChange} />;
  }
  return null;
};

// 공통: key가 날짜 관련 필드인지 판별
export function isDateField(key: string) {
  return key.toLowerCase().includes("date") || key.toLowerCase().includes("start") || key.toLowerCase().includes("end");
}

// 공통: formData 핸들러
export function handleChangeFactory(setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>) {
  return (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
}

export default TeamFormDynamic;
