// src/components/Admin/AdminDataTable.tsx
import React, { useState, useMemo, useEffect } from "react";
import { columnsByTeam, dateColumnsByTeam, osVersionMap } from "../../constants/dataconfig";
import type { AdminDataTableProps } from "../../types/Admin";
import RegisterEditModal from "./RegisterEditModal"; // 모달 import 꼭 확인
import "../../pages/Admin/AdminDataPage";
import { API_URLS } from "../../api/urls";

const DropdownButton = ({ label, selected, onClick, children, disabled }: any) => (
  <div className="admin-data-table-dropdown">
    <button
      onClick={onClick}
      className={`admin-data-table-btn${selected ? " selected" : ""}`}
      type="button"
      disabled={disabled}
      style={disabled ? { cursor: "not-allowed", color: "#aaa" } : undefined}
    >
      {label}
    </button>
    {children}
  </div>
);

const FilterCheckboxList = ({ values, selected, onChange, labelRender }: any) => (
  <div className="admin-data-table-dropdown-list" style={{ minWidth: 160, maxHeight: 240, marginTop: 4 }}>
    <button
      onClick={() => onChange([])}
      className={`admin-data-table-btn${selected.length === 0 ? " selected" : ""}`}
      type="button"
    >
      모두 보기
    </button>
    {values.map((value: string) => (
      <label key={value} className="admin-data-table-dropdown-checkbox-label">
        <input
          type="checkbox"
          checked={selected.includes(value)}
          onChange={() => onChange(
            selected.includes(value)
              ? selected.filter((v: string) => v !== value)
              : [...selected, value]
          )}
          style={{ marginRight: 8 }}
        />
        {labelRender ? labelRender(value) : value}
      </label>
    ))}
  </div>
);

const CompanySearchInput = ({ value, onChange }: any) => (
  <div className="admin-data-table-company-search">
    <input
      type="text"
      placeholder="회사명 검색"
      value={value}
      onChange={onChange}
    />
  </div>
);

let companyIdLabelToIdsMap: Record<string, string[]> = {};

const AdminDataTable: React.FC<AdminDataTableProps> = ({
  data,
  columns,
  loading,
  selectedTeam,
  selectedTeamLabel,
  fetchData,
}) => {
  const dateColumns = dateColumnsByTeam[selectedTeam] || [];
  const [dateFilterColumn, setDateFilterColumn] = useState<string>(dateColumns.length > 0 ? dateColumns[0].key : "");
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [companyNameQuery, setCompanyNameQuery] = useState<string>("");
  const [activeDropdown, setActiveDropdown] = useState<"dateColumn" | "year" | "month" | string | null>(null);

  // 체크박스 및 수정 모달 관련 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<Record<string, any> | null | undefined>(undefined);

  useEffect(() => {
    const newDateCols = dateColumnsByTeam[selectedTeam] || [];
    setDateFilterColumn(newDateCols.length > 0 ? newDateCols[0].key : "");
    setYearFilter(null);
    setMonthFilter(null);
    setFilters({});
    setActiveDropdown(null);
    setCompanyNameQuery("");
    setSelectedIds(new Set());   // 팀 바뀔 때 선택 초기화
    setModalVisible(false);

  }, [selectedTeam]);

  const excludedColumnsByTeam: { [key: string]: string[] } = {
    security: ["incident_no"],
    biz: ["manager_phone", "industry"],
    dev: ["progress"],
  };

  const filterableColumns =
    columnsByTeam[selectedTeam]?.filter(
      (col) =>
        !excludedColumnsByTeam[selectedTeam]?.includes(col.key) &&
        !dateColumns.some((d) => d.key === col.key)
    ) || [];

  const uniqueYears = useMemo(() => {
    const yearsSet = new Set<string>();
    data.forEach((row) => {
      const raw = row[dateFilterColumn];
      if (!raw) return;
      const d = new Date(raw);
      if (!isNaN(d.getTime())) yearsSet.add(String(d.getFullYear()));
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [data, dateFilterColumn]);

  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    data.forEach((row) => {
      const raw = row[dateFilterColumn];
      if (!raw) return;
      const d = new Date(raw);
      if (!isNaN(d.getTime()))
        monthsSet.add(String(d.getMonth() + 1).padStart(2, "0"));
    });
    return Array.from(monthsSet).sort();
  }, [data, dateFilterColumn]);

  const getProgressRanges = () => ["1~20", "21~40", "41~60", "61~80", "81~100"];

  const getFilterValues = (colKey: string) => {
    if (selectedTeam === "dev" && colKey === "progress") return getProgressRanges();
    if (selectedTeam === "dev" && colKey === "os_version") {
      const selectedOS = filters.os?.[0];
      return selectedOS ? osVersionMap[selectedOS] || [] : [];
    }
    if (colKey === "company_id") {
      const letterToLabelMap: Record<string, string> = {
        F: "금융",
        M: "제조",
        I: "IT",
        D: "유통",
      };
      const labelToCompanyIds: Record<string, string[]> = {};
      data.forEach((row) => {
        const val = row[colKey];
        if (typeof val === "string" && val.length > 0) {
          const firstLetter = val.charAt(0).toUpperCase();
          const label = letterToLabelMap[firstLetter];
          if (label) {
            if (!labelToCompanyIds[label]) labelToCompanyIds[label] = [];
            labelToCompanyIds[label].push(val);
          }
        }
      });
      companyIdLabelToIdsMap = labelToCompanyIds;
      return Object.keys(labelToCompanyIds).sort();
    }
    const valuesSet = new Set<string>();
    data.forEach((row) => {
      const val = row[colKey];
      if (val !== undefined && val !== null) valuesSet.add(val.toString());
    });
    return Array.from(valuesSet).sort();
  };

  const filteredData = data.filter((row) => {
    const rawDate = row[dateFilterColumn];
    if (!rawDate) return false;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return false;
    if (yearFilter && String(d.getFullYear()) !== yearFilter) return false;
    if (monthFilter && String(d.getMonth() + 1).padStart(2, "0") !== monthFilter) return false;

    if (
      (selectedTeam === "biz" || selectedTeam === "dev") &&
      companyNameQuery
    ) {
      // company_name 필드 존재 체크 + 문자열 변환 처리
      const companyName = row["company_name"];
      if (
        typeof companyName !== "string" ||
        !companyName.toLowerCase().includes(companyNameQuery.toLowerCase())
      ) {
        return false;
      }
    }

    // 기존 다중 필터 로직 그대로
    return Object.entries(filters).every(([colKey, values]) => {
      if (values.length === 0) return true;
      const val = row[colKey];
      if (!val) return false;

      if (colKey === "company_id") {
        const selectedIds = values.flatMap((label) => companyIdLabelToIdsMap[label] || []);
        return selectedIds.includes(val);
      }

      if (selectedTeam === "dev" && colKey === "progress") {
        const numeric = Number(val);
        if (isNaN(numeric)) return false;
        return values.some((range) => {
          const [min, max] = range.split("~").map(Number);
          return numeric >= min && numeric <= max;
        });
      }

      return values.includes(val.toString());
    });
  });

  const isAllSelected =
    filteredData.length > 0 &&
    filteredData.every((row, idx) =>
      selectedIds.has(row.id || `${row.company_id}-${idx}`)
    );

  const handleResetFilters = () => {
    setFilters({});
    setYearFilter(null);
    setMonthFilter(null);
    setCompanyNameQuery("");
    setActiveDropdown(null);
  };

  const handleDateColumnToggle = () => {
    if (dateColumns.length < 2) return;
    const currentIndex = dateColumns.findIndex((col) => col.key === dateFilterColumn);
    const nextIndex = (currentIndex + 1) % dateColumns.length;
    setDateFilterColumn(dateColumns[nextIndex].key);
    setYearFilter(null);
    setMonthFilter(null);
  };

  const getDisplayValue = (row: any, colKey: string) => {
    if ((selectedTeam === "dev" || selectedTeam === "security") && colKey === "company_id" && row["company_name"]) {
      return row["company_name"];
    }
    return row[colKey];
  };

  const getVisibleColumns = useMemo(() =>
    columns.filter((col) =>
      (columnsByTeam[selectedTeam] || []).some(
        (teamCol) =>
          teamCol.key === col.key &&
          !excludedColumnsByTeam[selectedTeam]?.includes(col.key)
      )
    ),
    [columns, selectedTeam]
  );
  
  // 체크박스 전체 선택
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredData.map((row, idx) => row.id || `${row.company_id}-${idx}`);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  // 체크박스 개별 선택
  // const handleSelectRow = (id: string) => {
  //   setSelectedIds((prev) => {
  //     const newSet = new Set(prev);
  //     if (newSet.has(id)) newSet.delete(id);
  //     else newSet.add(id);
  //     return newSet;
  //   });
  // };

// 등록 버튼 클릭
const handleRegisterClick = () => {
  setModalInitialData(null);  // 등록 모드
  setModalVisible(true);
};

// 수정 버튼 클릭
const handleEditClick = () => {
  if (selectedIds.size !== 1) {
    alert("하나의 행만 선택해주세요.");
    return;
  }

  const selectedId = Array.from(selectedIds)[0];

  const selectedRow = filteredData.find((row) => {
    const rowId =
      typeof row._id === "object" && "$oid" in row._id
        ? row._id.$oid
        : typeof row._id === "string"
        ? row._id
        : String(row._id);
    return rowId === selectedId;
  });

  if (!selectedRow) {
    alert("선택한 데이터를 찾을 수 없습니다.");
    return;
  }

  setModalInitialData(selectedRow);
  setModalVisible(true);
};

// 모달 제출 처리
const handleSubmit = async (formData: any) => {
  try {
    const endpointMap = {
      dev: "dev",
      biz: "biz",
      security: "security",
    };
    const endpoint = endpointMap[selectedTeam as keyof typeof endpointMap];

    if (modalInitialData) {
      // 수정 모드
        const itemId =
        typeof modalInitialData._id === "object" && "$oid" in modalInitialData._id
          ? modalInitialData._id.$oid
          : typeof modalInitialData._id === "string"
          ? modalInitialData._id
          : String(modalInitialData._id);

      // ✅ 여기! 콘솔 로그 추가
      console.log("🟡 수정 요청 itemId:", itemId);
      console.log("🟡 요청 URL:", `/api/${endpoint}/${itemId}`);
      console.log("🟡 전송 데이터:", formData);
      if (!itemId) throw new Error("수정할 데이터 ID가 없습니다.");
      const response = await fetch(`/api/${endpoint}/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("수정 실패");
    } else {
      // 등록 모드
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("등록 실패");
    }

    alert("저장되었습니다.");
    setModalVisible(false);
    setSelectedIds(new Set());
    fetchData?.();

  } catch (error) {
    console.error(error);
    alert("에러가 발생했습니다.");
  }
};


// 삭제 버튼 클릭
const handleDeleteClick = () => {
  if (selectedIds.size === 0) {
    alert("삭제할 항목을 선택해주세요.");
    return;
  }

  if (!window.confirm("정말 삭제하시겠습니까?")) {
    return;
  }

  console.log("🔍 selectedIds Set 상태:", selectedIds);
  console.log("🔍 selectedIds 배열:", Array.from(selectedIds));
  deleteSelectedItems();
};

// 삭제 요청 함수
const deleteSelectedItems = async () => {
  try {
    const endpointMap = {
      dev: API_URLS.DEV,
      biz: API_URLS.BIZ,
      security: API_URLS.SECURITY,
    };

    const endpoint = endpointMap[selectedTeam as keyof typeof endpointMap];
    if (!endpoint) throw new Error("잘못된 팀입니다.");

    const idsToDelete = Array.from(selectedIds);
    console.log("삭제할 ObjectId 리스트:", idsToDelete);  // 🔥 이제 제대로 찍힐 것

    if (idsToDelete.length === 0) {
      alert("삭제할 대상의 ObjectId를 찾을 수 없습니다.");
      return;
    }

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: idsToDelete }),
    });

    if (!response.ok) throw new Error("삭제 실패");

    alert("삭제되었습니다.");
    setSelectedIds(new Set());
    fetchData?.();

  } catch (error) {
    console.error(error);
    alert("삭제 중 오류가 발생했습니다.");
  }
};



  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="admin-data-table-container">
      <h2 className="admin-data-table-title">{selectedTeamLabel} 데이터</h2>

      {/* 날짜 필터 그룹 */}
      <div className="admin-data-table-date-filter-group">
        {dateColumns.length > 0 && (
          <DropdownButton
            label={dateColumns.find((col) => col.key === dateFilterColumn)?.label ?? "날짜 컬럼 선택"}
            selected={true}
            onClick={handleDateColumnToggle}
          />
        )}
        {/* 연도 선택 */}
        <DropdownButton
          label={`${yearFilter ?? "연도 선택"} ▼`}
          selected={!!yearFilter}
          onClick={() => setActiveDropdown((prev) => (prev === "year" ? null : "year"))}
        >
          {activeDropdown === "year" && (
            <div className="admin-data-table-dropdown-list">
              <button
                className={`admin-data-table-btn${yearFilter === null ? " selected" : ""}`}
                type="button"
                onClick={() => {
                  setYearFilter(null);
                  setMonthFilter(null);
                  setActiveDropdown(null);
                }}
              >
                모두 보기
              </button>
              {uniqueYears.map((y) => (
                <button
                  key={y}
                  className={`admin-data-table-btn${yearFilter === y ? " selected" : ""}`}
                  type="button"
                  onClick={() => {
                    setYearFilter(y);
                    setMonthFilter(null);
                    setActiveDropdown(null);
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </DropdownButton>

        {/* 월 선택 */}
        <DropdownButton
          label={`${monthFilter ? monthFilter + "월" : "월 선택"} ▼`}
          selected={!!monthFilter}
          onClick={() => {
            if (!yearFilter) return;
            setActiveDropdown((prev) => (prev === "month" ? null : "month"));
          }}
          disabled={!yearFilter}
        >
          {activeDropdown === "month" && yearFilter && (
            <div className="admin-data-table-dropdown-list">
              <button
                className={`admin-data-table-btn${monthFilter === null ? " selected" : ""}`}
                type="button"
                onClick={() => {
                  setMonthFilter(null);
                  setActiveDropdown(null);
                }}
              >
                모두 보기
              </button>
              {uniqueMonths.map((m) => (
                <button
                  key={m}
                  className={`admin-data-table-btn${monthFilter === m ? " selected" : ""}`}
                  type="button"
                  onClick={() => {
                    setMonthFilter(m);
                    setActiveDropdown(null);
                  }}
                >
                  {m}월
                </button>
              ))}
            </div>
          )}
        </DropdownButton>
      </div>

      {/* 다중 필터 영역 */}
      {filterableColumns.length > 0 && (
        <div className="admin-data-table-multi-filter-row">
          <div className="admin-data-table-multi-filter-group">
            {filterableColumns.map((col) => {
              const selected = filters[col.key] || [];
              return (
                <DropdownButton
                  key={col.key}
                  label={
                    col.key === "company_id" && selectedTeam === "dev"
                      ? "업종 ▼"
                      : `${col.label} ▼`
                  }
                  selected={selected.length > 0}
                  onClick={() => setActiveDropdown((prev) => (prev === col.key ? null : col.key))}
                >
                  {activeDropdown === col.key && (
                    <FilterCheckboxList
                      values={getFilterValues(col.key)}
                      selected={selected}
                      onChange={(newVals: string[]) => {
                        setFilters((prev) => ({ ...prev, [col.key]: newVals }));
                        setActiveDropdown(null);
                      }}
                      labelRender={
                        col.key === "company_id"
                          ? (value: string) => (value !== "" ? value : "(비어있음)")
                          : undefined
                      }
                    />
                  )}
                </DropdownButton>
              );
            })}
            {(Object.values(filters).some((vals) => vals.length > 0) ||
              yearFilter !== null ||
              monthFilter !== null) && (
              <button
                onClick={handleResetFilters}
                className="admin-data-table-reset-btn"
                type="button"
              >
                초기화
              </button>
            )}
          </div>

          {(selectedTeam === "biz" || selectedTeam === "dev") && (
            <CompanySearchInput
              value={companyNameQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyNameQuery(e.target.value)}
            />
          )}
        </div>
      )}

      {/* 테이블 렌더링 */}
      <table className="admin-data-table-table">
        <colgroup>
          <col style={{ width: "36px" }} />
          {getVisibleColumns.map((col) => {
            if (selectedTeam === "security") {
              if (col.key === "server_type") return <col key={col.key} style={{ width: "140px" }} />;
              if (col.key === "status") return <col key={col.key} style={{ width: "90px" }} />;
              if (col.key === "handler_count") return <col key={col.key} style={{ width: "100px" }} />;
            }
            return <col key={col.key} />;
          })}
        </colgroup>
        <thead>
          <tr>
            {/* 체크박스 전체 선택 */}
            <th>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            {getVisibleColumns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, idx) => {
            const rowId = row.id || `${row.company_id}-${idx}`; // ← 중복 피하기 위한 식별자
            return (
              <tr key={rowId}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(String(row._id))}
                    onChange={(e) => {
                      const idStr = typeof row._id === "object" && "$oid" in row._id
                        ? row._id.$oid
                        : typeof row._id === "string"
                        ? row._id
                        : String(row._id);

                      setSelectedIds((prev) => {
                        const newSet = new Set(prev);
                        if (e.target.checked) {
                          newSet.add(idStr); // ← selectedIds 에는 이 값이 들어감
                        } else {
                          newSet.delete(idStr);
                        }
                        return newSet;
                      });
                    }}
                  />
                </td>
                {getVisibleColumns.map((col) => (
                  <td key={col.key}>{getDisplayValue(row, col.key)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 우측 하단 고정 버튼 */}
      <div className="admin-data-table-fixed-buttons">
        <button
          className="admin-data-table-fixed-btn"
          onClick={handleRegisterClick} // 방금 만든 함수 연결
        >
          등록
        </button>
        <button
          className="admin-data-table-fixed-btn"
          onClick={handleEditClick}
        >
          수정
        </button>
        <button
          className="admin-data-table-fixed-btn"
          onClick={handleDeleteClick}  // 삭제 핸들러 연결
          disabled={selectedIds.size === 0}  // 선택된 게 없으면 비활성화
        >
        삭제
        </button>
      </div>

        {modalVisible && (
          <RegisterEditModal
            visible={modalVisible}
            team={selectedTeam}
            initialData={modalInitialData || undefined}
            onClose={() => setModalVisible(false)}
            onSubmit={handleSubmit}
          />
        )}
    </div>
  );
};

export default AdminDataTable;
