// 개발팀 동적 폼 컴포넌트 (등록/수정 모달용)
// 회사/운영체제/상태/담당자 등 입력 및 자동처리 지원

import React, { useEffect, useState } from "react";
import { columnsByTeam, selectOptions, statusOptions, osVersionMap } from "../../../constants/dataconfig";

interface DevFormProps {
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

// 오늘 날짜 반환 함수
const getToday = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const DevFormDynamic: React.FC<DevFormProps> = ({ initialData = {}, onChange }) => {
  // 개발팀 컬럼 정보
  const columns = columnsByTeam["dev"] || [];
  // 회사 옵션 목록
  const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([]);
  // 회사명 검색어 상태
  const [companySearch, setCompanySearch] = useState("");
  // 폼 데이터 상태 (초기값: initialData 또는 기본값)
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

  // 폼 필드 값 변경 핸들러
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

  // 개발팀 어드민 목록 상태
  const [devAdmins, setDevAdmins] = useState<{ nickname: string; phone: string }[]>([]);

  // 개발팀 어드민 목록 불러오기
  useEffect(() => {
    fetch("/api/admin/list")
      .then(res => res.json())
      .then((data) => {
        const admins = (data || []).filter((a: any) => a.team === "개발팀");
        setDevAdmins(admins);
      })
      .catch(() => setDevAdmins([]));
  }, []);

  // 담당자 선택 시 이름/전화번호 자동 입력
  const handleManagerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const selected = devAdmins.find(a => a.nickname === selectedName);
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
      {/* 회사명 검색 입력 */}
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
      {/* 회사명/ID 선택 */}
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
                    company_name: selected.label,  // 정확히 일치하는 값만
                  }));
                  setCompanySearch(selected.label); // UI상 입력된 값도 세팅
                } else {
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

      {/* 운영체제 선택 */}
      <div className="admin-modal-form-field">
        <label>운영체제</label>
        <select
          value={formData["os"]}
          onChange={(e) => {
            handleChange("os", e.target.value);
            handleChange("os_version", ""); // os_versions -> os_version으로 변경
          }}
        >
          <option value="">선택</option>
          {Object.keys(osVersionMap).map(os => (
            <option key={os} value={os}>{os}</option>
          ))}
        </select>
      </div>
      {/* OS 버전 선택 */}
      <div className="admin-modal-form-field">
        <label>OS 버전</label>
        <select
          value={formData["os_version"]} // os_versions -> os_version으로 변경
          onChange={(e) => handleChange("os_version", e.target.value)} // os_versions -> os_version으로 변경
          disabled={!formData["os"]}
        >
          <option value="">선택</option>
          {(osVersionMap[formData["os"]] || []).map(ver => (
            <option key={ver} value={ver}>{ver}</option>
          ))}
        </select>
      </div>

      {/* 시작일 입력 */}
      <div className="admin-modal-form-field">
        <label>시작일</label>
        <input
          type="date"
          value={formData["start_date"]}
          onChange={(e) => handleChange("start_date", e.target.value)}
        />
      </div>

      {/* 종료일 입력 */}
      <div className="admin-modal-form-field">
        <label>종료일</label>
        <input
          type="date"
          value={formData["end_date_fin"]}
          onChange={(e) => handleChange("end_date_fin", e.target.value)}
          disabled={false}
          min={formData["start_date"] || undefined}
        />
      </div>

      {/* 상태 선택 */}
      <div className="admin-modal-form-field">
        <label>상태</label>
        <select
          value={formData["dev_status"]}
          onChange={(e) => handleDevStatusChange(e.target.value)}
          disabled={false}
        >
          <option value="">선택</option>
          {(statusOptions["dev"] || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* 유지보수 선택 */}
      <div className="admin-modal-form-field">
        <label>유지보수</label>
        <select
          value={formData["maintenance"]}
          onChange={(e) => handleChange("maintenance", e.target.value)}
          disabled={false}
        >
          <option value="">선택</option>
          {(selectOptions["maintenance"] || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* 에러 선택 */}
      <div className="admin-modal-form-field">
        <label>에러</label>
        <select
          value={formData["error"]}
          onChange={(e) => handleChange("error", e.target.value)}
          disabled={false}
        >
          <option value="">선택</option>
          {(selectOptions["error"] || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* 담당자 수 선택 */}
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

      {/* 담당자명 드롭다운 */}
      <div className="admin-modal-form-field">
        <label>담당자명</label>
        <select
          value={formData["manager_name"]}
          onChange={handleManagerSelect}
        >
          <option value="">선택</option>
          {devAdmins.map((admin) => (
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
    </div>
  );
};

export default DevFormDynamic;
