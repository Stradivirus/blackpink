import React, { useEffect, useState } from "react";
import { columnsByTeam, selectOptions, statusOptions, osVersionMap } from "../../../constants/dataconfig";
import { isDateField, handleChangeFactory } from "./TeamFormDynamic";

interface DevFormProps {
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const DevFormDynamic: React.FC<DevFormProps> = ({ initialData = {}, onChange }) => {
  const columns = columnsByTeam["dev"] || [];
  const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    columns.forEach(({ key }) => {
      init[key] = initialData[key] ?? "";
    });
    return init;
  });

  useEffect(() => {
    fetch("/api/biz")
      .then((res) => res.json())
      .then((data) => {
        setCompanyOptions(
          (data.biz || []).map((c: any) => ({
            label: c.company_name,
            value: c.company_id,
          }))
        );
      });
  }, []);

  useEffect(() => {
    // 수정 모드(값이 있을 때)만 setFormData 실행
    if (initialData && Object.keys(initialData).length > 0) {
      const init: Record<string, any> = {};
      columns.forEach(({ key }) => {
        init[key] = initialData[key] ?? "";
      });
      setFormData(init);
    }
    // 등록 모드(빈 객체, undefined)일 때는 setFormData 실행하지 않음
  }, [initialData]);

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleChange = handleChangeFactory(setFormData);

  return (
    <>
      {columns.map(({ key, label }) => {
        if (key === "company_id") {
          const filteredOptions = companyOptions.filter((opt) => opt.label.includes(companySearch));
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>회사명</label>
              <input
                type="text"
                placeholder="회사명 검색"
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
                style={{ marginRight: 8 }}
              />
              <select
                value={formData[key]}
                onChange={e => {
                  const selected = companyOptions.find(opt => opt.value === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    company_id: selected ? selected.value : "",
                    company_name: selected ? selected.label : "",
                  }));
                }}
              >
                <option value="">선택</option>
                {filteredOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          );
        }
        if (["company_name", "os_versions"].includes(key)) return null; // company_name 과 os_versions 에 대한 중복 방지
        // os, progress, maintenance, status: select로 처리
        if (["os", "maintenance", "status"].includes(key)) {
          let options: string[] = [];
          if (key === "os") options = Object.keys(osVersionMap);
          else if (key === "status") options = statusOptions["dev"] || [];
          else options = selectOptions[key] || [];
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <select
                value={formData[key]}
                onChange={e => {
                  if (key === "os") {
                    handleChange("os", e.target.value);
                    handleChange("os_versions", "");
                  } else {
                    handleChange(key, e.target.value);
                  }
                }}
              >
                <option value="">선택</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {/* os_version은 os가 선택됐을 때만 select로 노출 */}
              {key === "os" && (
                <>
                  <label style={{ marginLeft: 8 }}>OS 버전</label>
                  <select
                    value={formData["os_versions"]}
                    onChange={e => handleChange("os_versions", e.target.value)}
                    disabled={!formData["os"]}
                  >
                    <option value="">선택</option>
                    {(osVersionMap[formData["os"]] || []).map((ver) => (
                      <option key={ver} value={ver}>{ver}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          );
        }
        // 날짜 관련 필드: 항상 입력 가능
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <label>{label}</label>
            <input
              type={isDateField(key) ? "date" : "text"}
              value={formData[key]}
              onChange={e => handleChange(key, e.target.value)}
              min={key === "end_date_fin" && formData["start_date"] ? formData["start_date"] : undefined}
            />
          </div>
        );
      })}
    </>
  );
};

export default DevFormDynamic;
