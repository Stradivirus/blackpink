// src/utils/dataHelpers.ts
// 데이터 필터/드롭다운용 간단 유틸 함수

// 특정 컬럼의 고유값(중복X) 배열 반환
export const getUniqueValues = (data: any[], columnKey: string): string[] => {
  const values = new Set<string>();
  data.forEach((row) => {
    if (row[columnKey] !== undefined && row[columnKey] !== null) {
      values.add(row[columnKey].toString());
    }
  });
  const numberColumns = ["handler_count", "처리인원수"];
  if (numberColumns.includes(columnKey)) {
    return Array.from(values).sort((a, b) => Number(a) - Number(b));
  }
  return Array.from(values).sort();
};

// 월별(YYYY-MM) 고유값 배열 반환
export const getUniqueMonths = (data: any[], columnKey: string): string[] => {
  const values = new Set<string>();
  data.forEach((row) => {
    const val = row[columnKey];
    if (!val) return;
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      values.add(ym);
    }
  });
  return Array.from(values).sort();
};

// 연도별 고유값 배열 반환
export const getAvailableYears = (data: any[], colKey: string): string[] => {
  const years = new Set<string>();
  data.forEach((row) => {
    const raw = row[colKey];
    if (!raw) return;
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      years.add(d.getFullYear().toString());
    }
  });
  return Array.from(years).sort();
};
