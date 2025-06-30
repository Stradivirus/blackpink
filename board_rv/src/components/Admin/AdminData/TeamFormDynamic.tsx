// 팀별 동적 폼 컴포넌트 (biz/security/dev 폼 자동 선택)
// 날짜 필드 판별 및 formData 핸들러 유틸 포함

import React from "react";
import BizFormDynamic from "./BizFormDynamic";
import SecurityFormDynamic from "./SecurityFormDynamic";
import DevFormDynamic from "./DevFormDynamic";

interface TeamFormDynamicProps {
  team: string;
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

// 팀에 따라 알맞은 폼 컴포넌트 렌더링
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

// key가 날짜 관련 필드인지 판별
export function isDateField(key: string) {
  return key.toLowerCase().includes("date") || key.toLowerCase().includes("start") || key.toLowerCase().includes("end");
}

// formData 핸들러 팩토리 함수
export function handleChangeFactory(setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>) {
  return (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
}

export default TeamFormDynamic;
