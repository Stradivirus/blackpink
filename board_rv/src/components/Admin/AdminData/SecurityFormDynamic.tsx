import React, { useEffect, useState } from "react";
import { columnsByTeam, selectOptions, statusOptions } from "../../../constants/dataconfig";
import { isDateField, handleChangeFactory } from "./TeamFormDynamic";

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
    if (initialData && Object.keys(initialData).length > 0) {
      const init: Record<string, any> = {};
      columns.forEach(({ key }) => {
        init[key] = initialData[key] ?? "";
      });
      setFormData(init);
    }
  }, [initialData]);

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleChange = handleChangeFactory(setFormData);

  return (
    <div className="admin-modal-form-grid">
      {/* 회사명 검색 */}
      <div className="admin-modal-form-field">
        <label>회사명 검색</label>
        <input
          type="text"
          placeholder="회사명 검색"
          value={companySearch}
          onChange={(e) => setCompanySearch(e.target.value)}
        />
      </div>
      {/* 회사명 선택 */}
      <div className="admin-modal-form-field">
        <label>회사명 선택</label>
        <select
          value={formData["company_id"]}
          onChange={(e) => {
            const selected = companyOptions.find((opt) => opt.value === e.target.value);
            setFormData((prev) => ({
              ...prev,
              company_id: selected ? selected.value : "",
              company_name: selected ? selected.label : "",
            }));
          }}
        >
          <option value="">선택</option>
          {companyOptions
            .filter((opt) => typeof opt.label === "string" && opt.label.includes(companySearch))
            .map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>
      </div>

      {/* 위협유형 */}
      <div className="admin-modal-form-field">
        <label>위협유형</label>
        <select
          value={formData["threat_type"]}
          onChange={(e) => handleChange("threat_type", e.target.value)}
        >
          <option value="">선택</option>
          {(selectOptions["threat_type"] || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* 위험등급 */}
      <div className="admin-modal-form-field">
        <label>위험등급</label>
        <select
          value={formData["risk_level"]}
          onChange={(e) => handleChange("risk_level", e.target.value)}
        >
          <option value="">선택</option>
          {(selectOptions["risk_level"] || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* 서버종류 */}
      <div className="admin-modal-form-field">
        <label>서버종류</label>
        <select
          value={formData["server_type"]}
          onChange={(e) => handleChange("server_type", e.target.value)}
        >
          <option value="">선택</option>
          {(selectOptions["server_type"] || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="admin-modal-form-field" />

      {/* 사건일자 */}
      <div className="admin-modal-form-field">
        <label>사건일자</label>
        <input
          type="date"
          value={formData["incident_date"]}
          onChange={(e) => handleChange("incident_date", e.target.value)}
        />
      </div>

      {/* 처리일자 */}
      <div className="admin-modal-form-field">
        <label>처리일자</label>
        <input
          type="date"
          value={formData["handled_date"]}
          onChange={(e) => handleChange("handled_date", e.target.value)}
          min={formData["incident_date"] || undefined}
        />
      </div>

      {/* 상태 */}
      <div className="admin-modal-form-field">
        <label>상태</label>
        <select
          value={formData["status"]}
          onChange={(e) => handleChange("status", e.target.value)}
        >
          <option value="">선택</option>
          {(statusOptions["security"] || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* 조치 */}
      <div className="admin-modal-form-field">
        <label>조치</label>
        <select
          value={formData["action"]}
          onChange={(e) => handleChange("action", e.target.value)}
        >
          <option value="">선택</option>
          {(selectOptions["action"] || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* 처리인원 수 */}
      <div className="admin-modal-form-field">
        <label>처리인원 수</label>
        <select
          value={formData["handler_count"]}
          onChange={(e) => handleChange("handler_count", e.target.value)}
        >
          <option value="">선택</option>
          {[...Array(10).keys()]
            .map((num) => num + 1)
            .map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
        </select>
      </div>
      <div className="admin-modal-form-field" />
    </div>
  );
};

export default SecurityFormDynamic;
