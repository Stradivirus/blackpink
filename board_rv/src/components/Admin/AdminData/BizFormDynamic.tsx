import React, { useEffect, useState } from "react";
import { columnsByTeam, selectOptions, statusOptions } from "../../../constants/dataconfig";
import { isDateField, handleChangeFactory } from "./TeamFormDynamic";
import axios from "axios";
import { API_URLS } from "../../../api/urls";

interface BizFormProps {
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const contractPeriods = [
  { value: 30, label: "1개월" },
  { value: 90, label: "3개월" },
  { value: 180, label: "6개월" },
  { value: 365, label: "1년" },
  { value: 1095, label: "3년" },
];

const getToday = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const BizFormDynamic: React.FC<BizFormProps> = ({ initialData = {}, onChange }) => {
  const columns = columnsByTeam["biz"] || [];
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    columns.forEach(({ key }) => {
      if (key === "contract_start" && !initialData[key]) {
        init[key] = getToday(); // 오늘 날짜 기본값
      } else if (key === "status" && !initialData[key]) {
        init[key] = statusOptions.biz[0];
      } else {
        init[key] = initialData[key] ?? "";
      }
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

  // 계약 기간 버튼 클릭 시
  const handlePeriodClick = (days: number) => {
    const start = formData["contract_start"];
    if (start) {
      const startDate = new Date(start);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + days);
      const endStr = endDate.toISOString().slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        contract_period: days,
        contract_end: endStr,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        contract_period: days,
      }));
    }
  };

  // 계약 시작일 변경 시, 계약 기간이 선택되어 있으면 종료일 자동 계산
  useEffect(() => {
    if (formData["contract_start"] && formData["contract_period"]) {
      handlePeriodClick(Number(formData["contract_period"]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData["contract_start"]]);

  // 전화번호 자동 하이픈 함수
  function formatPhoneNumber(value: string) {
    // 숫자만 남기기
    const onlyNums = value.replace(/[^0-9]/g, "");
    if (onlyNums.length < 4) return onlyNums;
    if (onlyNums.length < 8) {
      return onlyNums.replace(/(\d{2,3})(\d{3,4})/, "$1-$2");
    }
    return onlyNums.replace(/(\d{2,3})(\d{3,4})(\d{4})/, "$1-$2-$3");
  }

  return (
    <div className="admin-modal-form-grid">
      {/* 회사코드 */}
      <div className="admin-modal-form-field">
        <label>회사코드</label>
        <input
          type="text"
          value={formData["company_id"]}
          onChange={(e) => handleChange("company_id", e.target.value)}
          placeholder="업종을 선택하면 자동 입력"
          readOnly
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

      {/* 계약 기간 버튼 그룹 */}
      <div className="admin-modal-form-field">
        <label>계약 기간</label>
        <div style={{ display: "flex", gap: 8 }}>
          {contractPeriods.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={formData["contract_period"] === opt.value ? "selected" : ""}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border: "1px solid #ccc",
                background: formData["contract_period"] === opt.value ? "#1976d2" : "#fff",
                color: formData["contract_period"] === opt.value ? "#fff" : "#222",
                cursor: "pointer",
              }}
              onClick={() => handlePeriodClick(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 계약 종료일 */}
      <div className="admin-modal-form-field">
        <label>
          계약 종료일 <span style={{ color: "#888", fontSize: "0.95em" }}>(기간 선택시 자동 입력)</span>
        </label>
        <input
          type="date"
          value={formData["contract_end"]}
          readOnly
          placeholder="계약 기간을 선택하세요"
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
        {statusOptions.biz.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>

    {/* 담당자명과 연락처: 2칸 합쳐서 한 줄 */}
    <div className="admin-modal-form-field" style={{ gridColumn: "1 / span 1" }}>
      <label>담당자명</label>
      <input
        type="text"
        value={formData["manager_name"]}
        onChange={(e) => handleChange("manager_name", e.target.value)}
        placeholder="담당자명 입력"
      />
    </div>
    <div className="admin-modal-form-field" style={{ gridColumn: "2 / span 1" }}>
      <label>담당자 연락처</label>
      <input
        type="text"
        value={formData["manager_phone"]}
        onChange={(e) =>
          handleChange("manager_phone", formatPhoneNumber(e.target.value))
        }
        placeholder="담당자 연락처 입력"
        maxLength={13} // 000-0000-0000
      />
    </div>
  </div>
);
};

export default BizFormDynamic;
