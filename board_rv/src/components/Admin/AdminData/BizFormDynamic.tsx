import React, { useEffect, useState } from "react";
import { columnsByTeam, selectOptions } from "../../../constants/dataconfig";
import { isDateField, handleChangeFactory } from "./TeamFormDynamic";

interface BizFormProps {
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const BizFormDynamic: React.FC<BizFormProps> = ({ initialData = {}, onChange }) => {
  const columns = columnsByTeam["biz"] || [];
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    columns.forEach(({ key }) => {
      init[key] = initialData[key] ?? "";
    });
    return init;
  });

  useEffect(() => {
    // 수정 모드(값이 있을 때)만 setFormData 실행
    if (initialData && Object.keys(initialData).length > 0) {
      const init: Record<string, any> = {};
      columns.forEach(({ key }) => {
        init[key] = initialData[key] ?? "";
      });
      setFormData(init);
    }
    // 등록 모드(빈 객체)일 때는 setFormData 실행하지 않음
  }, [initialData]); // columns는 의존성에서 제거

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleIndustryChange = async (value: string) => {
    setFormData((prev) => ({ ...prev, industry: value, company_id: "" })); // 업종 바꿀 때 company_id만 초기화, 나머지 값 보존
    if (value) {
      try {
        const res = await fetch(`/api/biz/next-company-id?industry=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.next_company_id) {
          setFormData((prev) => ({ ...prev, company_id: data.next_company_id })); // 기존 값 보존
        }
      } catch (e) {}
    }
  };

  // 등록/수정 모드 구분
  const isEdit = initialData && Object.keys(initialData).length > 0;

  const handleChange = handleChangeFactory(setFormData);

  return (
    <>
      {columns.map(({ key, label }) => {
        // company_id: 등록 시에는 입력 가능, 수정 시에는 읽기전용
        if (key === "company_id") {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <input
                type="text"
                value={formData[key]}
                placeholder="업종 선택 시 자동 생성"
                readOnly={isEdit}
                onChange={!isEdit ? (e) => handleChange(key, e.target.value) : undefined}
              />
            </div>
          );
        }
        // company_name: 등록/수정 모두 입력 가능, 조건 없이
        if (key === "company_name") {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <input
                type="text"
                value={formData[key]}
                onChange={e => handleChange(key, e.target.value)}
                placeholder="회사명을 입력하세요"
              />
            </div>
          );
        }
        // industry: 업종 선택 시 company_id 자동 할당
        if (key === "industry") {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <select
                value={formData[key]}
                onChange={e => handleIndustryChange(e.target.value)}
              >
                <option value="">선택</option>
                {selectOptions[key].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        }
        // plan, status: 항상 선택 가능
        if (["plan", "status"].includes(key)) {
          const options = key === "status" ? (selectOptions[key].length > 0 ? selectOptions[key] : ["진행중", "만료", "해지"]) : selectOptions[key];
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
        // 날짜 관련 필드: 항상 입력 가능
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <label>{label}</label>
            <input
              type={isDateField(key) ? "date" : "text"}
              value={formData[key]}
              onChange={e => handleChange(key, e.target.value)}
              min={key === "contract_end" && formData["contract_start"] ? formData["contract_start"] : undefined}
            />
          </div>
        );
      })}
    </>
  );
};

export default BizFormDynamic;
