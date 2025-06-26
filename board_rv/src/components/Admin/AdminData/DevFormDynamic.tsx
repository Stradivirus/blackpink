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

  // 회사명 목록 fetch
  useEffect(() => {
    fetch("/api/biz")
      .then((res) => res.json())
      .then((data) => {
        setCompanyOptions(
          (data.biz || [])
            .filter((c: any) => typeof c.company_name === "string" && typeof c.company_id === "string")
            .map((c: any) => ({
              label: c.company_name,  
              value: c.company_id,
            }))
        );
      });
  }, []);

  // 초기 데이터 세팅 (수정 모드)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const init: Record<string, any> = {};
      columns.forEach(({ key }) => {
        init[key] = initialData[key] ?? "";
      });
      setFormData(init);
    }
  }, [initialData]);

  // 부모 컴포넌트에 변경 데이터 전달
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleChange = handleChangeFactory(setFormData);

  // dev_status 상태값
  const devStatus = formData["dev_status"];
  const endDate = formData["end_date_fin"];

  // 상태별 필드 활성/비활성 로직
  // const isDevDone = devStatus === "개발 완료";
  const isDevStop = devStatus === "개발 중지";
  const isDevPlannedOrInProgress = ["개발 예정", "개발 진행중"].includes(devStatus);

  // 종료일 필드 비활성 조건 (개발 예정, 진행중일 때 비활성)
  const disableEndDate = isDevPlannedOrInProgress;

  // 유지보수 및 에러 필드 비활성 조건
  // end_date_fin 없거나, 개발 중지 또는 개발 예정/진행중일 때 비활성
  const disableMaintErr = !endDate || isDevStop || isDevPlannedOrInProgress;

  // dev_status 변경 시 처리 (개발 중지면 maintenance, error 값 초기화)
  const handleDevStatusChange = (value: string) => {
    setFormData((prev) => {
      if (value === "개발 중지") {
        return {
          ...prev,
          dev_status: value,
          maintenance: "",
          error: "",
        };
      }
      return { ...prev, dev_status: value };
    });
  };

  return (
    <div className="admin-modal-form-grid">
      <div className="admin-modal-form-field">
        <label>회사명 검색</label>
        <input
          type="text"
          placeholder="회사명 검색"
          value={companySearch}
          onChange={(e) => setCompanySearch(e.target.value)}
        />
      </div>
      <div className="admin-modal-form-field">
        <label>회사 선택</label>
        <select
          value={formData["company_id"]}
          onChange={(e) => {
            const selected = companyOptions.find(opt => opt.value === e.target.value);
            setFormData(prev => ({
              ...prev,
              company_id: selected ? selected.value : "",
              company_name: selected ? selected.label : "",
            }));
          }}
        >
          <option value="">선택</option>
          {companyOptions
            .filter(opt => typeof opt.label === "string" && opt.label.includes(companySearch))
            .map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="admin-modal-form-field">
        <label>운영체제</label>
        <select
          value={formData["os"]}
          onChange={(e) => {
            handleChange("os", e.target.value);
            handleChange("os_versions", "");
          }}
        >
          <option value="">선택</option>
          {Object.keys(osVersionMap).map(os => (
            <option key={os} value={os}>{os}</option>
          ))}
        </select>
      </div>
      <div className="admin-modal-form-field">
        <label>OS 버전</label>
        <select
          value={formData["os_versions"]}
          onChange={(e) => handleChange("os_versions", e.target.value)}
          disabled={!formData["os"]}
        >
          <option value="">선택</option>
          {(osVersionMap[formData["os"]] || []).map(ver => (
            <option key={ver} value={ver}>{ver}</option>
          ))}
        </select>
      </div>

      <div className="admin-modal-form-field">
        <label>시작일</label>
        <input
          type="date"
          value={formData["start_date"]}
          onChange={(e) => handleChange("start_date", e.target.value)}
        />
      </div>

      <div className="admin-modal-form-field">
        <label>상태</label>
        <select
          value={formData["dev_status"]}
          onChange={(e) => handleDevStatusChange(e.target.value)}
        >
          <option value="">선택</option>
          {(statusOptions["dev"] || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="admin-modal-form-field">
        <label>종료일</label>
        <input
          type="date"
          value={formData["end_date_fin"]}
          onChange={(e) => handleChange("end_date_fin", e.target.value)}
          disabled={disableEndDate}
          min={formData["start_date"] || undefined}
        />
      </div>

      <div className="admin-modal-form-field">
        <label>유지보수</label>
        <select
          value={formData["maintenance"]}
          onChange={(e) => handleChange("maintenance", e.target.value)}
          disabled={disableMaintErr}
        >
          <option value="">선택</option>
          {(selectOptions["maintenance"] || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="admin-modal-form-field">
        <label>에러</label>
        <select
          value={formData["error"]}
          onChange={(e) => handleChange("error", e.target.value)}
          disabled={disableMaintErr}
        >
          <option value="">선택</option>
          {(selectOptions["error"] || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="admin-modal-form-field">
        <label>담당자 수</label>
        <select
          value={formData["handler_count"]}
          onChange={(e) => handleChange("handler_count", e.target.value)}
        >
          <option value="">선택</option>
          {[2,3,4,5,6,7,8].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DevFormDynamic;
