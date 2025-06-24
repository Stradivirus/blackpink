import React, { useState, useEffect } from "react";
import { columnsByTeam, osVersionMap, selectOptions, statusOptions } from "../../../constants/dataconfig";

interface TeamFormDynamicProps {
  team: string;
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const TeamFormDynamic: React.FC<TeamFormDynamicProps> = ({
  team,
  initialData = {},
  onChange,
}) => {
  const columns = columnsByTeam[team] || [];

  // 사업팀 회사 목록 상태
  const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([]);

  // 회사명 검색어 상태 (간단한 필터용)
  const [companySearch, setCompanySearch] = useState("");

  // 회사 목록 불러오기 (security, dev에서만)
  useEffect(() => {
    if (team === "security" || team === "dev") {
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
    }
  }, [team]);

  // 기존 코드 유지
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    columns.forEach(({ key }) => {
      init[key] = initialData[key] ?? "";
    });
    return init;
  });

  // ★ 추가: initialData나 columns가 바뀌면 formData를 재설정
  useEffect(() => {
    const init: Record<string, any> = {};
    columns.forEach(({ key }) => {
      init[key] = initialData[key] ?? "";
    });
    setFormData(init);
  }, [initialData, columns]);

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleIndustryChange = async (value: string) => {
    setFormData((prev) => ({
      ...prev,
      industry: value,
    }));

    if (value) {
      try {
        const res = await fetch(
          `/api/biz/next-company-id?industry=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        if (data.next_company_id) {
          setFormData((prev) => ({
            ...prev,
            company_id: data.next_company_id,
          }));
        }
      } catch (e) {
        // 에러 처리 (필요시)
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        company_id: "",
      }));
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {columns.map(({ key, label }) => {
        // company_id, company_name 필드 처리
        if (key === "company_id" || key === "company_name") {
          // 등록 모드
          if (!initialData || Object.keys(initialData).length === 0) {
            // 기존 등록 로직(보안/개발팀: 검색+select, 사업팀: 자동 할당)
            if (team === "biz" && key === "company_id") {
              return (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label>{label}</label>
                  <input
                    type="text"
                    value={formData[key]}
                    readOnly
                    placeholder="업종 선택 시 자동 생성"
                  />
                </div>
              );
            }
            if ((team === "security" || team === "dev") && key === "company_id") {
              // 검색어로 필터링
              const filteredOptions = companyOptions.filter((opt) =>
                opt.label.includes(companySearch)
              );
              return (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label>회사명</label>
                  <input
                    type="text"
                    placeholder="회사명 검색"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    style={{ marginRight: 8 }}
                  />
                  <select
                    value={formData[key]}
                    onChange={(e) => {
                      const selected = companyOptions.find(
                        (opt) => opt.value === e.target.value
                      );
                      setFormData((prev) => ({
                        ...prev,
                        company_id: selected ? selected.value : "",
                        company_name: selected ? selected.label : "",
                      }));
                    }}
                  >
                    <option value="">선택</option>
                    {filteredOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            // company_name은 등록 시에는 필요 없으면 생략
            return null;
          }
          // 수정 모드: 읽기전용 input으로 표시
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{key === "company_id" ? "회사코드" : "회사명"}</label>
              <input
                type="text"
                value={formData[key]}
                readOnly
              />
            </div>
          );
        }

        // 업종 select
        if (key === "industry") {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <select
                value={formData[key]}
                onChange={(e) => handleIndustryChange(e.target.value)}
              >
                <option value="">선택</option>
                {selectOptions[key].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // company_id는 사업팀 등록에서만 자동 할당, 직접 입력 불가(읽기전용)
        if (key === "company_id" && team === "biz") {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <input
                type="text"
                value={formData[key]}
                readOnly
                placeholder="업종 선택 시 자동 생성"
              />
            </div>
          );
        }

        // OS 필드일 경우 OS버전 Select도 같이 렌더링
        if (key === "os") {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <select
                value={formData[key]}
                onChange={(e) => {
                  handleChange("os", e.target.value);
                  handleChange("os_version", "");
                }}
              >
                <option value="">선택</option>
                {Object.keys(osVersionMap).map((os) => (
                  <option key={os} value={os}>
                    {os}
                  </option>
                ))}
              </select>
              <label style={{ marginLeft: 8 }}>OS 버전</label>
              <select
                value={formData["os_version"]}
                onChange={(e) => handleChange("os_version", e.target.value)}
                disabled={!formData["os"]}
              >
                <option value="">선택</option>
                {(osVersionMap[formData["os"]] || []).map((ver) => (
                  <option key={ver} value={ver}>
                    {ver}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // 상태 필드일 경우 (selectOptions보다 위에 위치해야 함)
        if (key === "status") {
          const options = statusOptions[team as keyof typeof statusOptions] || [];
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <select
                value={formData[key]}
                onChange={(e) => handleChange(key, e.target.value)}
              >
                <option value="">선택</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // select 옵션이 있는 필드는 select로 렌더링
        if (selectOptions[key]) {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{label}</label>
              <select
                value={formData[key]}
                onChange={(e) => handleChange(key, e.target.value)}
              >
                <option value="">선택</option>
                {selectOptions[key].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // 날짜 관련 필드 판단 (key에 'date', 'start', 'end' 포함시)
        const isDateField =
          key.toLowerCase().includes("date") ||
          key.toLowerCase().includes("start") ||
          key.toLowerCase().includes("end");

        // 기본 input
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <label>{label}</label>
            <input
              type={isDateField ? "date" : "text"}
              value={formData[key]}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        );
      })}
    </>
  );
};

export default TeamFormDynamic;
