import React, { useState, useEffect } from "react";
import { columnsByTeam, osVersionMap } from "../../constants/dataconfig";

interface TeamFormDynamicProps {
  team: string;
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const TeamFormDynamic: React.FC<TeamFormDynamicProps> = ({
  team,
  initialData = {},
  onChange,
}) => {
  const columns = columnsByTeam[team] || [];

  // 초기 상태 세팅
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    columns.forEach(({ key }) => {
      init[key] = initialData[key] ?? "";
    });
    return init;
  });

  // 상태 변경 시 상위에 전달
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  // 입력값 변경 처리
  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {columns.map(({ key, label }) => {
        // OS 필드일 경우 OS버전 Select도 같이 렌더링
        if (key === "os") {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <select
                value={formData[key]}
                onChange={(e) => {
                  handleChange("os", e.target.value);
                  // OS 변경 시 OS버전 초기화
                  handleChange("os_version", "");
                }}
              >
                <option value="">선택</option>
                {Object.keys(osVersionMap).map((os) => (
                  <option key={os} value={os}>
                    {os}
                  </option>
                ))}
              </select>

              <label style={{ marginLeft: 8 }}>OS 버전</label>
              <select
                value={formData["os_version"]}
                onChange={(e) => handleChange("os_version", e.target.value)}
                disabled={!formData["os"]}
              >
                <option value="">선택</option>
                {(osVersionMap[formData["os"]] || []).map((ver) => (
                  <option key={ver} value={ver}>
                    {ver}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // 날짜 관련 필드 판단 (key에 'date', 'start', 'end' 포함시)
        const isDateField =
          key.toLowerCase().includes("date") ||
          key.toLowerCase().includes("start") ||
          key.toLowerCase().includes("end");

        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <label>{label}</label>
            <input
              type={isDateField ? "date" : "text"}
              value={formData[key]}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        );
      })}
    </>
  );
};

export default TeamFormDynamic;
