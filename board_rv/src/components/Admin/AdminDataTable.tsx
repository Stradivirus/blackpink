// src/components/Admin/AdminDataTable.tsx
import React, { useState, useMemo, useEffect } from "react";
import { columnsByTeam, dateColumnsByTeam, osVersionMap } from "../../constants/dataconfig";
import type { AdminDataTableProps } from "../../types/Admin";

// DropdownButton: 버튼 + 드롭다운 리스트(옵션 선택)
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

// FilterCheckboxList: 체크박스 리스트(다중 선택)
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

// CompanySearchInput: 회사명 검색 input
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

const AdminDataTable: React.FC<AdminDataTableProps> = ({
  data,
  columns,
  loading,
  selectedTeam,
  selectedTeamLabel,
}) => {
  const dateColumns = dateColumnsByTeam[selectedTeam] || [];
  const [dateFilterColumn, setDateFilterColumn] = useState<string>(
    dateColumns.length > 0 ? dateColumns[0].key : ""
  );
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [companyNameQuery, setCompanyNameQuery] = useState<string>(""); // 회사명 텍스트 검색 상태
  const [activeDropdown, setActiveDropdown] = useState<
    "dateColumn" | "year" | "month" | string | null
  >(null);

  useEffect(() => {
    const newDateCols = dateColumnsByTeam[selectedTeam] || [];
    setDateFilterColumn(newDateCols.length > 0 ? newDateCols[0].key : "");
    setYearFilter(null);
    setMonthFilter(null);
    setFilters({});
    setActiveDropdown(null);
    setCompanyNameQuery(""); // 팀 변경 시 회사명 검색어 초기화
  }, [selectedTeam]);

  const excludedColumnsByTeam: { [key: string]: string[] } = {
    security: ["incident_no"],
    biz: ["manager_phone"],
    dev: ["contract_end"],
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
    if (selectedTeam === "dev" && colKey === "progress")
      return getProgressRanges();
    if (selectedTeam === "dev" && colKey === "os_version") {
      const selectedOS = filters.os?.[0];
      return selectedOS ? osVersionMap[selectedOS] || [] : [];
    }
    if (colKey === "company_id") {
      const firstLetters = new Set<string>();
      data.forEach((row) => {
        const val = row[colKey];
        if (typeof val === "string" && val.length > 0) {
          firstLetters.add(val.charAt(0).toUpperCase());
        }
      });
      return Array.from(firstLetters).sort();
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
    if (
      monthFilter &&
      String(d.getMonth() + 1).padStart(2, "0") !== monthFilter
    )
      return false;

    if (
      selectedTeam === "biz" &&
      companyNameQuery &&
      typeof row["company_name"] === "string" &&
      !row["company_name"]
        .toLowerCase()
        .includes(companyNameQuery.toLowerCase())
    ) {
      return false;
    }

    return Object.entries(filters).every(([colKey, values]) => {
      if (values.length === 0) return true;
      const val = row[colKey];
      if (!val) return false;

      if (colKey === "company_id") {
        if (typeof val !== "string" || val.length === 0) return false;
        return values.includes(val.charAt(0).toUpperCase());
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

  const handleResetFilters = () => {
    setFilters({});
    setYearFilter(null);
    setMonthFilter(null);
    setCompanyNameQuery("");
    setActiveDropdown(null);
  };

  const handleDateColumnToggle = () => {
    if (dateColumns.length < 2) return;
    const currentIndex = dateColumns.findIndex(
      (col) => col.key === dateFilterColumn
    );
    const nextIndex = (currentIndex + 1) % dateColumns.length;
    setDateFilterColumn(dateColumns[nextIndex].key);
    setYearFilter(null);
    setMonthFilter(null);
  };

  // company_id 대신 company_name을 보여주도록 보조 함수
  const getDisplayValue = (row: any, colKey: string) => {
    // dev, security만 company_id 대신 company_name 표시
    if (
      (selectedTeam === "dev" || selectedTeam === "security") &&
      colKey === "company_id" &&
      row["company_name"]
    ) {
      return row["company_name"];
    }
    return row[colKey];
  };

  // 컬럼 필터링 함수로 중복 제거
  const getVisibleColumns = useMemo(() =>
    columns.filter(
      (col) =>
        (columnsByTeam[selectedTeam] || []).some(
          (teamCol) =>
            teamCol.key === col.key &&
            !excludedColumnsByTeam[selectedTeam]?.includes(col.key)
        )
    ),
    [columns, selectedTeam]
  );

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

      {/* 기존 다중 필터 (날짜 필터용 컬럼 제외) */}
      {filterableColumns.length > 0 && (
        <div className="admin-data-table-multi-filter-row">
          <div className="admin-data-table-multi-filter-group">
            {filterableColumns.map((col) => {
              const selected = filters[col.key] || [];
              return (
                <DropdownButton
                  key={col.key}
                  label={`${col.label} ▼`}
                  selected={selected.length > 0}
                  onClick={() => setActiveDropdown((prev) => prev === col.key ? null : col.key)}
                >
                  {activeDropdown === col.key && (
                    <FilterCheckboxList
                      values={getFilterValues(col.key)}
                      selected={selected}
                      onChange={(newVals: string[]) => {
                        setFilters((prev) => ({ ...prev, [col.key]: newVals }));
                        setActiveDropdown(null);
                      }}
                      labelRender={col.key === "company_id"
                        ? (value: string) => value !== "" ? value : "(비어있음)"
                        : undefined}
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
          {selectedTeam === "biz" && (
            <CompanySearchInput
              value={companyNameQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyNameQuery(e.target.value)}
            />
          )}
        </div>
      )}

      {/* 데이터 테이블 */}
      <table className="admin-data-table-table">
        <thead>
          <tr>
            {getVisibleColumns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row, idx) => (
              <tr key={idx}>
                {getVisibleColumns.map((col) => (
                  <td key={col.key}>{getDisplayValue(row, col.key)}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={getVisibleColumns.length} className="admin-data-table-no-data">
                선택된 필터에 해당하는 데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDataTable;