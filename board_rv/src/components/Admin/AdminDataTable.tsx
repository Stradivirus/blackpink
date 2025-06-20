// src/components/Admin/AdminDataTable.tsx
import React, { useState, useMemo, useEffect } from "react";
import { columnsByTeam } from "../../constants/dataconfig";
import type { AdminDataTableProps } from "../../types/Admin";

// 팀별 날짜 필터용 컬럼 정보 정의
const dateColumnsByTeam: {
  [team: string]: { key: string; label: string }[];
} = {
  security: [
    { key: "incident_date", label: "사건일자" },
    { key: "handled_date", label: "처리일자" },
  ],
  biz: [
    { key: "contract_start", label: "계약 시작일" },
    { key: "contract_end", label: "계약 종료일" },
  ],
  dev: [
    { key: "dev_start_date", label: "개발 시작일" },
    { key: "dev_end_date", label: "개발 종료일" },
  ],
};

// OS에 따른 버전 맵
const osVersionMap: Record<string, string[]> = {
  Windows: ["7", "8", "10", "11"],
  Linux: ["Rocky 8", "Rocky 9", "Ubuntu 18.04", "Ubuntu 20.04", "Ubuntu 22.04"],
  Android: ["10", "11", "12", "13"],
  iOS: ["15", "16", "17"],
  macOS: ["11", "12", "13", "14"],
};

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

  const toggleFilterValue = (columnKey: string, value: string) => {
    setFilters((prev) => {
      let newFilters = { ...prev };
      if (columnKey === "os") {
        newFilters["os_version"] = [];
      }
      const prevValues = prev[columnKey] || [];
      const newValues = prevValues.includes(value)
        ? prevValues.filter((v) => v !== value)
        : [...prevValues, value];
      newFilters[columnKey] = newValues;
      return newFilters;
    });
  };

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

  const buttonBaseStyle: React.CSSProperties = {
    padding: "6px 12px",
    border: "1px solid #ccc",
    borderRadius: 4,
    backgroundColor: "#f8f9fa",
    color: "black",
    cursor: "pointer",
    fontWeight: "normal",
  };

  const buttonSelectedStyle: React.CSSProperties = {
    backgroundColor: "#007bff",
    color: "white",
    fontWeight: "bold",
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>{selectedTeamLabel} 데이터</h2>

      {/* 날짜 필터 그룹 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {dateColumns.length > 0 && (
          <button
            onClick={handleDateColumnToggle}
            style={{ ...buttonBaseStyle, ...buttonSelectedStyle }}
            type="button"
          >
            {dateColumns.find((col) => col.key === dateFilterColumn)?.label ??
              "날짜 컬럼 선택"}
          </button>
        )}

        {/* 연도 선택 */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() =>
              setActiveDropdown((prev) => (prev === "year" ? null : "year"))
            }
            style={{
              ...buttonBaseStyle,
              ...(yearFilter ? buttonSelectedStyle : {}),
              minWidth: 100,
              textAlign: "left",
            }}
            type="button"
          >
            {yearFilter ?? "연도 선택"} ▼
          </button>
          {activeDropdown === "year" && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 10,
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: 4,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                maxHeight: 200,
                overflowY: "auto",
                minWidth: 120,
              }}
            >
              <button
                style={{
                  ...buttonBaseStyle,
                  ...(yearFilter === null ? buttonSelectedStyle : {}),
                  width: "100%",
                  border: "none",
                  borderRadius: 0,
                  textAlign: "left",
                }}
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
                  style={{
                    ...buttonBaseStyle,
                    ...(yearFilter === y ? buttonSelectedStyle : {}),
                    width: "100%",
                    border: "none",
                    borderRadius: 0,
                    textAlign: "left",
                  }}
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
        </div>

        {/* 월 선택 */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              if (!yearFilter) return;
              setActiveDropdown((prev) => (prev === "month" ? null : "month"));
            }}
            style={{
              ...buttonBaseStyle,
              ...(monthFilter ? buttonSelectedStyle : {}),
              minWidth: 100,
              textAlign: "left",
              cursor: yearFilter ? "pointer" : "not-allowed",
              color: yearFilter ? "black" : "#aaa",
            }}
            type="button"
            disabled={!yearFilter}
          >
            {monthFilter ? `${monthFilter}월` : "월 선택"} ▼
          </button>
          {activeDropdown === "month" && yearFilter && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 10,
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: 4,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                maxHeight: 200,
                overflowY: "auto",
                minWidth: 120,
              }}
            >
              <button
                style={{
                  ...buttonBaseStyle,
                  ...(monthFilter === null ? buttonSelectedStyle : {}),
                  width: "100%",
                  border: "none",
                  borderRadius: 0,
                  textAlign: "left",
                }}
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
                  style={{
                    ...buttonBaseStyle,
                    ...(monthFilter === m ? buttonSelectedStyle : {}),
                    width: "100%",
                    border: "none",
                    borderRadius: 0,
                    textAlign: "left",
                  }}
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
        </div>
      </div>

      {/* 기존 다중 필터 (날짜 필터용 컬럼 제외) */}
      {filterableColumns.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {/* 왼쪽: 다중 필터 드롭다운과 초기화 버튼 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {filterableColumns.map((col) => {
              const selected = filters[col.key] || [];
              return (
                <div key={col.key} style={{ position: "relative" }}>
                  <button
                    onClick={() =>
                      setActiveDropdown((prev) =>
                        prev === col.key ? null : (col.key as string)
                      )
                    }
                    style={{
                      ...buttonBaseStyle,
                      ...(selected.length > 0 ? buttonSelectedStyle : {}),
                    }}
                    type="button"
                  >
                    {col.label} ▼
                  </button>
                  {activeDropdown === col.key && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        zIndex: 10,
                        backgroundColor: "white",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        minWidth: 160,
                        maxHeight: 240,
                        overflowY: "auto",
                        marginTop: 4,
                      }}
                    >
                      <button
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, [col.key]: [] }));
                          setActiveDropdown(null);
                        }}
                        style={{
                          ...buttonBaseStyle,
                          ...(selected.length === 0 ? buttonSelectedStyle : {}),
                          width: "100%",
                          border: "none",
                          borderRadius: 0,
                          textAlign: "left",
                        }}
                        type="button"
                      >
                        모두 보기
                      </button>
                      {getFilterValues(col.key).map((value) => (
                        <label
                          key={value}
                          style={{
                            display: "block",
                            padding: "6px 10px",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(value)}
                            onChange={() => toggleFilterValue(col.key, value)}
                            style={{ marginRight: 8 }}
                          />
                          {/* company_id 필터 드롭다운에서는 첫 글자만 표시 */}
                          {col.key === "company_id" && value !== ""
                            ? `${value}`
                            : value === ""
                            ? "(비어있음)"
                            : value}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {(Object.values(filters).some((vals) => vals.length > 0) ||
              yearFilter !== null ||
              monthFilter !== null) && (
              <button
                onClick={handleResetFilters}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  backgroundColor: "#f44336",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "bold",
                  height: 36,
                  alignSelf: "center",
                }}
                type="button"
              >
                초기화
              </button>
            )}
          </div>

          {/* 오른쪽: 회사명 검색창 */}
          {selectedTeam === "biz" && (
            <div style={{ marginTop: 10 }}>
              <input
                type="text"
                placeholder="회사명 검색"
                value={companyNameQuery}
                onChange={(e) => setCompanyNameQuery(e.target.value)}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  minWidth: 200,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* 데이터 테이블 */}
      <table border={1} cellPadding={4} style={{ width: "100%", marginTop: 16 }}>
        <thead>
          <tr>
            {columns
              .filter(
                (col) =>
                  (columnsByTeam[selectedTeam] || []).some(
                    (teamCol) =>
                      teamCol.key === col.key &&
                      !excludedColumnsByTeam[selectedTeam]?.includes(col.key)
                  )
              )
              .map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row, idx) => (
              <tr key={idx}>
                {columns
                  .filter(
                    (col) =>
                      (columnsByTeam[selectedTeam] || []).some(
                        (teamCol) =>
                          teamCol.key === col.key &&
                          !excludedColumnsByTeam[selectedTeam]?.includes(col.key)
                      )
                  )
                  .map((col) => (
                    <td key={col.key}>
                      {/* 테이블 데이터에서는 company_id 전체 값 표시 */}
                      {row[col.key]}
                    </td>
                  ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: 20 }}>
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