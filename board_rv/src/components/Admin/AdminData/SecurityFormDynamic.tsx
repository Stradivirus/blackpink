import React, { useEffect, useState } from "react";
import { columnsByTeam, selectOptions, statusOptions, osVersionMap } from "../../../constants/dataconfig";

interface SecurityFormProps {
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const SecurityFormDynamic: React.FC<SecurityFormProps> = ({ initialData = {}, onChange }) => {
  const columns = columnsByTeam["security"] || [];
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

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {columns.map(({ key, label }) => {
        if (key === "company_id") {
          // company_id에 해당하는 회사명을 읽기전용 input으로 보여주기
          const companyName = formData.company_name || (companyOptions.find(opt => opt.value === formData.company_id)?.label) || formData.company_id || "";
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>회사명</label>
              <input
                type="text"
                value={companyName}
                readOnly
                style={{ background: '#f5f5f5' }}
              />
            </div>
          );
        }
        if (key === "company_name") return null;
        if (key === "os") {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <select
                value={formData[key]}
                onChange={e => {
                  handleChange("os", e.target.value);
                  handleChange("os_version", "");
                }}
              >
                <option value="">선택</option>
                {Object.keys(osVersionMap).map((os) => (
                  <option key={os} value={os}>{os}</option>
                ))}
              </select>
              <label style={{ marginLeft: 8 }}>OS 버전</label>
              <select
                value={formData["os_version"]}
                onChange={e => handleChange("os_version", e.target.value)}
                disabled={!formData["os"]}
              >
                <option value="">선택</option>
                {(osVersionMap[formData["os"]] || []).map((ver) => (
                  <option key={ver} value={ver}>{ver}</option>
                ))}
              </select>
            </div>
          );
        }
        if (key === "status") {
          const options = statusOptions["security"] || [];
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <select
                value={formData[key]}
                onChange={e => handleChange(key, e.target.value)}
              >
                <option value="">선택</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        }
        if (key === "handler_count") {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <select
                value={formData[key]}
                onChange={e => handleChange(key, e.target.value)}
              >
                <option value="">선택</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          );
        }
        if (selectOptions[key]) {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <select
                value={formData[key]}
                onChange={e => handleChange(key, e.target.value)}
              >
                <option value="">선택</option>
                {selectOptions[key].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        }
        const isDateField = key.toLowerCase().includes("date") || key.toLowerCase().includes("start") || key.toLowerCase().includes("end");
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <label>{label}</label>
            <input
              type={isDateField ? "date" : "text"}
              value={formData[key]}
              onChange={e => handleChange(key, e.target.value)}
            />
          </div>
        );
      })}
    </>
  );
};

export default SecurityFormDynamic;
