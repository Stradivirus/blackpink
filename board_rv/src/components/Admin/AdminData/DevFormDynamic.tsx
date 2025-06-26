import React, { useEffect, useState } from "react";
import { columnsByTeam, selectOptions, statusOptions, osVersionMap } from "../../../constants/dataconfig";

interface DevFormProps {
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const getToday = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const DevFormDynamic: React.FC<DevFormProps> = ({ initialData = {}, onChange }) => {
  const columns = columnsByTeam["dev"] || [];
  const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    columns.forEach(({ key }) => {
      if (key === "start_date") {
        init[key] = initialData[key] ?? getToday();
      } else if (key === "dev_status") {
        init[key] = initialData[key] ?? "개발 예정";
      } else if (key === "error") {
        // 등록 모드일 때만 "에러 없음" 기본값
        init[key] = initialData[key] ?? (Object.keys(initialData).length === 0 ? "에러 없음" : "");
      } else {
        init[key] = initialData[key] ?? "";
      }
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

  // company_id/company_name이 비어있으면 initialData로 보정
  useEffect(() => {
    if (
      initialData &&
      Object.keys(initialData).length > 0 &&
      (
        !formData.company_id ||
        !formData.company_name
      )
    ) {
      setFormData(prev => ({
        ...prev,
        company_id: prev.company_id || initialData.company_id || "",
        company_name: prev.company_name || initialData.company_name || "",
      }));
    }
    // eslint-disable-next-line
  }, [initialData, formData.company_id, formData.company_name]);

  // formData 변경 시 부모에 전달
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // dev_status 변경 시 처리
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

  // 회사명 검색 자동 선택 로직
  useEffect(() => {
    if (companySearch) {
      const filtered = companyOptions.filter(
        opt => typeof opt.label === "string" && opt.label.includes(companySearch)
      );
      if (filtered.length > 0 && formData["company_id"] !== filtered[0].value) {
        setFormData(prev => ({
          ...prev,
          company_id: filtered[0].value,
          company_name: filtered[0].label,
        }));
      }
    }
    if (!companySearch && formData["company_id"]) {
      setFormData(prev => ({
        ...prev,
        company_id: "",
        company_name: "",
      }));
    }
    // eslint-disable-next-line
  }, [companySearch, companyOptions]);

  const processedData: any = {};
  Object.entries(formData).forEach(([k, v]) => {
    if (["maintenance", "error", "end_date_fin"].includes(k) && v === "") {
      processedData[k] = null;
    } else {
      processedData[k] = v;
    }
  });

  // dev_status 상태값
  const devStatus = formData["dev_status"];
  const endDate = formData["end_date_fin"];

  // 상태별 필드 활성/비활성 로직
  const isDevStop = devStatus === "개발 중지";
  const isDevPlannedOrInProgress = ["개발 예정", "개발 진행중"].includes(devStatus);

  // 종료일 필드 비활성 조건 (개발 예정, 진행중일 때 비활성)
  const disableEndDate = isDevPlannedOrInProgress;

  // 유지보수 및 에러 필드 비활성 조건
  // const disableMaintErr = !endDate || isDevStop || isDevPlannedOrInProgress; // 기존 코드
  const disableMaintErr = false; // 유지보수 항상 선택 가능

  // "에러" 필드: 수정 모드에서 비어 있으면 "에러 없음"으로 설정
  useEffect(() => {
    if (
      initialData &&
      Object.keys(initialData).length > 0 &&
      (!formData.error || formData.error === "")
    ) {
      setFormData(prev => ({
        ...prev,
        error: "에러 없음",
      }));
    }
    // eslint-disable-next-line
  }, [initialData, formData.error]);

  return (
    <div className="admin-modal-form-grid">
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
              setFormData(prev => ({
                ...prev,
                company_id: selected ? selected.value : "",
                company_name: selected ? selected.label : "",
              }));
              if (selected) setCompanySearch(selected.label);
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
        <label>종료일</label>
        <input
          type="date"
          value={formData["end_date_fin"]}
          onChange={(e) => handleChange("end_date_fin", e.target.value)}
          // 등록 모드: 항상 활성화, 수정 모드: 항상 활성화
          disabled={false}
          min={formData["start_date"] || undefined}
        />
      </div>

      <div className="admin-modal-form-field">
        <label>상태</label>
        <select
          value={formData["dev_status"]}
          onChange={(e) => handleDevStatusChange(e.target.value)}
          // 등록/수정 모두 활성화
          disabled={false}
        >
          <option value="">선택</option>
          {(statusOptions["dev"] || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="admin-modal-form-field">
        <label>유지보수</label>
        <select
          value={formData["maintenance"]}
          onChange={(e) => handleChange("maintenance", e.target.value)}
          disabled={false} // 항상 선택 가능
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
          // 등록/수정 모두 활성화
          disabled={false}
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
