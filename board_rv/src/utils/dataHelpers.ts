// src/utils/dataHelpers.ts
// 유틸 함수
// 드롭다운 창에 보여줄 필터 옵션 (고유값)
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

// ✅ 월별 필터용 함수 추가
export const getUniqueMonths = (data: any[], columnKey: string): string[] => {
  const values = new Set<string>();
  data.forEach((row) => {
    const val = row[columnKey];
    if (!val) return; // ✅ null, undefined, 빈값은 제외

    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      values.add(ym);
    }
  });

  return Array.from(values).sort();
};

// 연 월 필터용 함수
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

  return Array.from(years).sort(); // 오름차순 정렬
};
