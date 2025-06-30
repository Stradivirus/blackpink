import React, { useEffect, useState } from "react";
import { columnsByTeam, selectOptions, statusOptions } from "../../../constants/dataconfig";
import { handleChangeFactory } from "./TeamFormDynamic";

interface SecurityFormProps {
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const getToday = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const SecurityFormDynamic: React.FC<SecurityFormProps> = ({ initialData = {}, onChange }) => {
  const columns = columnsByTeam["security"] || [];
  const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([]);
  const [companySearch, setCompanySearch] = useState("");

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    columns.forEach(({ key }) => {
      if (initialData[key] !== undefined && initialData[key] !== null) {
        init[key] = initialData[key];
      } else {
        if (key === "incident_date") {
          init[key] = getToday();
        } else if (key === "status") {
          init[key] = "진행중";
        } else {
          init[key] = "";
        }
      }
    });
    return init;
  });

  // 보안팀 어드민 목록 상태
  const [securityAdmins, setSecurityAdmins] = useState<{ nickname: string; phone: string }[]>([]);

  // 보안팀 어드민 목록 불러오기
  useEffect(() => {
    fetch("/api/admin/list")
      .then((res) => res.json())
      .then((data) => {
        const admins = (data || []).filter((a: any) => a.team === "보안팀");
        setSecurityAdmins(admins);
      })
      .catch(() => setSecurityAdmins([]));
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

  // 담당자 선택 시 이름/전화번호 자동 입력
  const handleManagerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const selected = securityAdmins.find((a) => a.nickname === selectedName);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        manager_name: selected.nickname,
        manager_phone: selected.phone,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        manager_name: "",
        manager_phone: "",
      }));
    }
  };

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
          disabled={!!initialData && Object.keys(initialData).length > 0}
        />
      </div>
      {/* 회사명 선택 */}
      <div className="admin-modal-form-field">
        <label>회사 선택</label>
        {initialData && Object.keys(initialData).length > 0 ? (
          // 수정 모드: 회사명만 읽기전용, 값이 없으면 initialData에서 보여줌
          <input
            type="text"
            value={
              formData["company_name"] !== undefined && formData["company_name"] !== ""
                ? formData["company_name"]
                : initialData.company_name || ""
            }
            readOnly
          />
        ) : (
          // 등록 모드: 드롭다운
            <select
              value={formData["company_id"]}
              onChange={(e) => {
                const selected = companyOptions.find(opt => opt.value === e.target.value);
                if (selected) {
                  setFormData(prev => ({
                    ...prev,
                    company_id: selected.value,
                    company_name: selected.label,  // ✅ 정확히 일치하는 값만
                  }));
                  setCompanySearch(selected.label); // UI상 입력된 값도 세팅
                } else {
                  // 선택 안된 경우 초기화
                  setFormData(prev => ({
                    ...prev,
                    company_id: "",
                    company_name: "",
                  }));
                }
              }}
            >
            <option value="">선택</option>
            {companyOptions
              .filter(opt => typeof opt.label === "string" && opt.label.includes(companySearch))
              .map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
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
      {/* 담당자명 드롭다운 */}
      <div className="admin-modal-form-field">
        <label>담당자명</label>
        <select
          value={formData["manager_name"]}
          onChange={handleManagerSelect}
        >
          <option value="">선택</option>
          {securityAdmins.map((admin) => (
            <option key={admin.nickname} value={admin.nickname}>
              {admin.nickname}
            </option>
          ))}
        </select>
      </div>
      {/* 담당자 연락처: 읽기 전용 */}
      <div className="admin-modal-form-field">
        <label>담당자 연락처</label>
        <input
          type="text"
          value={formData["manager_phone"] || ""}
          readOnly
          placeholder="담당자 선택시 자동 입력"
        />
      </div>
      <div className="admin-modal-form-field" />
    </div>
  );
};

export default SecurityFormDynamic;
