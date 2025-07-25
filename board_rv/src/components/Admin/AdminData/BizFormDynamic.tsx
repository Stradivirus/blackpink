// 사업팀 동적 폼 컴포넌트 (등록/수정 모달용)
// 업종 선택 시 회사코드 자동, 계약기간 자동계산, 담당자 자동입력 등 지원

import React, { useEffect, useState } from "react";
import { columnsByTeam, selectOptions, statusOptions } from "../../../constants/dataconfig";
import { handleChangeFactory } from "./TeamFormDynamic";
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

// 오늘 날짜 반환 함수
const getToday = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const BizFormDynamic: React.FC<BizFormProps> = ({ initialData = {}, onChange }) => {
  // 사업팀 컬럼 정보
  const columns = columnsByTeam["biz"] || [];
  // 폼 데이터 상태 (초기값: initialData 또는 기본값)
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
  }, [formData["industry"]]);

  // 초기 데이터 변경 시 폼 데이터 동기화
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const init: Record<string, any> = {};
      columns.forEach(({ key }) => {
        init[key] = initialData[key] ?? "";
      });
      setFormData(init);
    }
  }, [initialData]);

  // formData 변경 시 상위로 전달
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  // 폼 필드 값 변경 핸들러
  const handleChange = handleChangeFactory(setFormData);

  // 계약 기간 버튼 클릭 시 종료일 자동 계산
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

  // 사업팀 어드민 목록 상태
  const [bizAdmins, setBizAdmins] = useState<{ nickname: string; phone: string }[]>([]);

  // 사업팀 어드민 목록 불러오기
  useEffect(() => {
    axios.get(API_URLS.ADMIN_LIST)
      .then(res => {
        // 팀이 "사업팀"인 관리자만 추출
        const admins = (res.data || []).filter((a: any) => a.team === "사업팀");
        setBizAdmins(admins);
      })
      .catch(() => setBizAdmins([]));
  }, []);

  // 담당자 선택 시 이름/전화번호 자동 입력
  const handleManagerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const selected = bizAdmins.find(a => a.nickname === selectedName);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        manager_name: selected.nickname,
        manager_phone: selected.phone,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        manager_name: "",
        manager_phone: "",
      }));
    }
  };

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
      <select
        value={formData["manager_name"]}
        onChange={handleManagerSelect}
      >
        <option value="">선택</option>
        {bizAdmins.map((admin) => (
          <option key={admin.nickname} value={admin.nickname}>
            {admin.nickname}
          </option>
        ))}
      </select>
    </div>
    <div className="admin-modal-form-field" style={{ gridColumn: "2 / span 1" }}>
      <label>담당자 연락처</label>
      <input
        type="text"
        value={formData["manager_phone"]}
        readOnly
        placeholder="담당자 선택시 자동 입력"
      />
    </div>
  </div>
);
};

export default BizFormDynamic;
