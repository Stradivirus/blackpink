import React, { useEffect, useState } from "react";
import { columnsByTeam, selectOptions } from "../../../constants/dataconfig";
import { isDateField, handleChangeFactory } from "./TeamFormDynamic";
import axios from "axios";
import { API_URLS } from "../../../api/urls";

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

  // 업종이 선택되면 회사코드 자동 할당
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (formData["industry"] && !formData["company_id"]) {
        try {
          const res = await axios.get(
            `${API_URLS.BIZ}/next-company-id?industry=${encodeURIComponent(formData["industry"])}`
          );
          if (res.data?.next_company_id) {
            setFormData((prev) => ({
              ...prev,
              company_id: res.data.next_company_id,
            }));
          }
        } catch (e) {
          // 에러 무시 또는 필요시 처리
        }
      }
    };
    fetchCompanyId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData["industry"]]);

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
      {/* 회사코드 */}
      <div className="admin-modal-form-field">
        <label>회사코드</label>
        <input
          type="text"
          value={formData["company_id"]}
          onChange={(e) => handleChange("company_id", e.target.value)}
          placeholder="회사코드 입력"
          readOnly // 자동입력이므로 읽기전용 처리(원하면 제거)
        />
      </div>
      {/* 회사명 */}
      <div className="admin-modal-form-field">
        <label>회사명</label>
        <input
          type="text"
          value={formData["company_name"]}
          onChange={(e) => handleChange("company_name", e.target.value)}
          placeholder="회사명 입력"
        />
      </div>

      {/* 업종 */}
      <div className="admin-modal-form-field">
        <label>업종</label>
        <select
          value={formData["industry"]}
          onChange={(e) => handleChange("industry", e.target.value)}
        >
          <option value="">선택</option>
          {selectOptions["industry"].map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      {/* 플랜 */}
      <div className="admin-modal-form-field">
        <label>플랜</label>
        <select
          value={formData["plan"]}
          onChange={(e) => handleChange("plan", e.target.value)}
        >
          <option value="">선택</option>
          {selectOptions["plan"].map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* 계약 시작일 */}
      <div className="admin-modal-form-field">
        <label>계약 시작일</label>
        <input
          type="date"
          value={formData["contract_start"]}
          onChange={(e) => handleChange("contract_start", e.target.value)}
        />
      </div>
      {/* 계약 종료일 */}
      <div className="admin-modal-form-field">
        <label>계약 종료일</label>
        <input
          type="date"
          value={formData["contract_end"]}
          onChange={(e) => handleChange("contract_end", e.target.value)}
          min={formData["contract_start"] || undefined}
        />
      </div>

    {/* 상태: 한 칸만 차지 */}
    <div className="admin-modal-form-field">
      <label>상태</label>
      <select
        value={formData["status"]}
        onChange={(e) => handleChange("status", e.target.value)}
      >
        <option value="">선택</option>
        {selectOptions["status"].map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>

    {/* 담당자명과 연락처: 2칸 합쳐서 한 줄 */}
    <div className="admin-modal-form-field" style={{ gridColumn: "1 / span 1" }}>
      <label>담당자명</label>
      <input
        type="text"
        value={formData["handler_name"]}
        onChange={(e) => handleChange("handler_name", e.target.value)}
        placeholder="담당자명 입력"
      />
    </div>
    <div className="admin-modal-form-field" style={{ gridColumn: "2 / span 1" }}>
      <label>담당자 연락처</label>
      <input
        type="text"
        value={formData["handler_contact"]}
        onChange={(e) => handleChange("handler_contact", e.target.value)}
        placeholder="담당자 연락처 입력"
      />
    </div>
  </div>
);
};

export default BizFormDynamic;
