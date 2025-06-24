import { useState, useMemo, useEffect } from "react";
import { columnsByTeam, dateColumnsByTeam, osVersionMap } from "../../../constants/dataconfig";

export function useAdminDataTableFilters(data: any[], columns: any[], selectedTeam: string) {
  const dateColumns = dateColumnsByTeam[selectedTeam] || [];
  const [dateFilterColumn, setDateFilterColumn] = useState<string>(dateColumns.length > 0 ? dateColumns[0].key : "");
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [companyNameQuery, setCompanyNameQuery] = useState<string>("");
  const [activeDropdown, setActiveDropdown] = useState<"dateColumn" | "year" | "month" | string | null>(null);

  // 팀이 바뀌면 필터 상태 초기화
  useEffect(() => {
    setDateFilterColumn(dateColumns.length > 0 ? dateColumns[0].key : "");
    setYearFilter(null);
    setMonthFilter(null);
    setFilters({});
    setCompanyNameQuery("");
    setActiveDropdown(null);
  }, [selectedTeam]);

  // 제외 컬럼
  const excludedColumnsByTeam: { [key: string]: string[] } = {
    security: ["incident_no"],
    biz: ["manager_phone", "industry"],
    dev: ["progress"],
  };

  // 필터 가능한 컬럼
  const filterableColumns =
    columnsByTeam[selectedTeam]?.filter(
      (col) =>
        !excludedColumnsByTeam[selectedTeam]?.includes(col.key) &&
        !dateColumns.some((d) => d.key === col.key)
    ) || [];

  // 연도/월 목록
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

  // 업종/OS/진행상태 등 필터 값
  let companyIdLabelToIdsMap: Record<string, string[]> = {};
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

  // 필터링된 데이터
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
      const companyName = row["company_name"];
      if (
        typeof companyName !== "string" ||
        !companyName.toLowerCase().includes(companyNameQuery.toLowerCase())
      ) {
        return false;
      }
    }

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

  // 필터 초기화
  const handleResetFilters = () => {
    setFilters({});
    setYearFilter(null);
    setMonthFilter(null);
    setCompanyNameQuery("");
    setActiveDropdown(null);
  };

  // 날짜 컬럼 순환
  const handleDateColumnToggle = () => {
    if (dateColumns.length < 2) return;
    const currentIndex = dateColumns.findIndex((col) => col.key === dateFilterColumn);
    const nextIndex = (currentIndex + 1) % dateColumns.length;
    setDateFilterColumn(dateColumns[nextIndex].key);
    setYearFilter(null);
    setMonthFilter(null);
  };

  return {
    dateColumns,
    dateFilterColumn,
    setDateFilterColumn,
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    filters,
    setFilters,
    companyNameQuery,
    setCompanyNameQuery,
    activeDropdown,
    setActiveDropdown,
    filterableColumns,
    uniqueYears,
    uniqueMonths,
    getFilterValues,
    filteredData,
    handleResetFilters,
    handleDateColumnToggle,
  };
}