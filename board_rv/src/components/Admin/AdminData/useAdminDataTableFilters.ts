// 테이블 필터, 검색, 페이지네이션 등 데이터 가공 커스텀 훅
// 팀/컬럼별 동적 필터, 연도/월, 회사명 검색 등 다양한 필터링 지원

import { useState, useMemo, useEffect, useRef } from "react";
import { dateColumnsByTeam, osVersionMap } from "../../../constants/dataconfig";

export function useAdminDataTableFilters(data: any[], columns: any[], selectedTeam: string) {
  // 날짜 컬럼, 필터 상태, 검색어 등 다양한 상태 관리
  const dateColumns = dateColumnsByTeam[selectedTeam] || [];
  const [dateFilterColumn, setDateFilterColumn] = useState<string>(dateColumns.length > 0 ? dateColumns[0].key : "");
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [companyNameQuery, setCompanyNameQuery] = useState<string>("");
  const [activeDropdown, setActiveDropdown] = useState<"dateColumn" | "year" | "month" | string | null>(null);
  const itemsPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const companyNameFilterKey = "company_name";

  // 회사명-회사ID 매핑을 위한 ref
  const companyIdLabelToIdsMapRef = useRef<Record<string, string[]>>({});

  // 팀 변경 시 필터 상태 초기화
  useEffect(() => {
    setDateFilterColumn(dateColumns.length > 0 ? dateColumns[0].key : "");
    setYearFilter(null);
    setMonthFilter(null);
    setFilters({});
    setCompanyNameQuery("");
    setActiveDropdown(null);
  }, [selectedTeam]);

  // 팀별로 제외할 컬럼 정의
  const excludedColumnsByTeam: { [key: string]: string[] } = {
    security: ["incident_no"],
    biz: ["manager_phone", "industry"],
    dev: ["dev_days"],
  };

  // 실제 필터 가능한 컬럼만 추출
  const filterableColumns =
    columns?.filter(
      (col) =>
        !excludedColumnsByTeam[selectedTeam]?.includes(col.key) &&
        !dateColumns.some((d) => d.key === col.key) &&
        !((selectedTeam === "biz" || selectedTeam === "dev" || selectedTeam === "security") && col.key === companyNameFilterKey)
    ) || [];

  // 연도 목록 추출
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

  // 월 목록 추출
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

  // 각 컬럼별 필터 값 목록 반환
  const getFilterValues = (colKey: string) => {
    if (selectedTeam === "dev" && colKey === "os_versions") {
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
      companyIdLabelToIdsMapRef.current = labelToCompanyIds;
      return Object.keys(labelToCompanyIds).sort();
    }

    // 일반 컬럼의 고유 값 목록 반환
    const valuesSet = new Set<number | string>();
    data.forEach((row) => {
      let val = row[colKey];
      if (val !== undefined && val !== null) {
        // 숫자면 숫자로, 아니면 문자열로 저장
        const num = Number(val);
        if (!isNaN(num)) {
          valuesSet.add(num);
        } else {
          valuesSet.add(val.toString());
        }
      }
    });

    const valuesArray = Array.from(valuesSet);
    const areAllNumeric = valuesArray.every((v) => typeof v === "number");

    return areAllNumeric
      ? (valuesArray as number[]).sort((a, b) => a - b).map(String)
      : valuesArray.map(String).sort();
  };

  // 모든 필터 조건을 반영한 데이터 반환
  const filteredData = data.filter((row) => {
    const rawDate = row[dateFilterColumn];
    if (!rawDate) return false;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return false;
    if (yearFilter && String(d.getFullYear()) !== yearFilter) return false;
    if (monthFilter && String(d.getMonth() + 1).padStart(2, "0") !== monthFilter) return false;

    // 회사명 검색어 필터
    if (
      (selectedTeam === "biz" || selectedTeam === "dev" || selectedTeam === "security") &&
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

    // 각 컬럼별 필터 적용
    return Object.entries(filters).every(([colKey, values]) => {
      if (values.length === 0) return true;
      const val = row[colKey];
      if (!val) return false;

      if (colKey === "company_id") {
        const selectedIds = values.flatMap((label) => companyIdLabelToIdsMapRef.current[label] || []);
        return selectedIds.includes(val);
      }

      return values.includes(val.toString());
    });
  });

  // 모든 필터 상태 초기화
  const handleResetFilters = () => {
    setFilters({});
    setYearFilter(null);
    setMonthFilter(null);
    setCompanyNameQuery("");
    setActiveDropdown(null);
  };

  // 날짜 컬럼 순환(다음 컬럼으로 변경)
  const handleDateColumnToggle = () => {
    if (dateColumns.length < 2) return;
    const currentIndex = dateColumns.findIndex((col) => col.key === dateFilterColumn);
    const nextIndex = (currentIndex + 1) % dateColumns.length;
    setDateFilterColumn(dateColumns[nextIndex].key);
    setYearFilter(null);
    setMonthFilter(null);
  };

  // 페이지네이션: 현재 페이지 데이터만 반환
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // 필터/검색/날짜컬럼 변경 시 1페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, yearFilter, monthFilter, companyNameQuery, dateFilterColumn]);

  // 페이지네이션 버튼 계산
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const maxPageButtons = 10;
  const currentGroup = Math.floor((currentPage - 1) / maxPageButtons);
  const startPage = currentGroup * maxPageButtons + 1;
  const endPage = Math.min(startPage + maxPageButtons - 1, totalPages);

  const paginationPages = [];
  for (let i = startPage; i <= endPage; i++) {
    paginationPages.push(i);
  }

  // 훅에서 제공하는 값 및 함수들 반환
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
    paginatedData,
    itemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    paginationPages,
    startPage,
    endPage,
  };
}
