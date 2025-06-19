// src/utils/dataProcessing.ts

interface GroupedDataItem {
  groupKey: string;
  items: any[];
  count: number;
}

interface ProcessedDataResult {
  type: 'flat' | 'grouped';
  data: any[] | GroupedDataItem[];
}

/**
 * 데이터를 특정 컬럼을 기준으로 그룹화하는 함수
 * @param dataToGroup 그룹화할 원본 데이터 배열
 * @param columnKey 그룹화할 컬럼의 키 (예: 'threat_type')
 * @returns 그룹화된 데이터 또는 일반 데이터
 */
export const getGroupedData = (dataToGroup: any[], columnKey: string | null): ProcessedDataResult => {
  if (!columnKey || !dataToGroup || dataToGroup.length === 0) {
    return { type: 'flat', data: dataToGroup }; // 그룹화 안 된 일반 데이터
  }

  const grouped: { [key: string]: any[] } = {};
  dataToGroup.forEach(row => {
    const keyValue = row[columnKey] || 'N/A'; // 그룹화할 키 값, 없으면 'N/A'
    if (!grouped[keyValue]) {
      grouped[keyValue] = [];
    }
    grouped[keyValue].push(row);
  });

  // 그룹화된 데이터를 배열로 변환하여 반환
  const groupedArray: GroupedDataItem[] = Object.keys(grouped).map(key => ({
    groupKey: key,   // 그룹의 키 (예: "DDoS", "멀웨어")
    items: grouped[key], // 해당 그룹에 속하는 원본 데이터 항목들
    count: grouped[key].length // 각 그룹의 항목 수
  }));

  return { type: 'grouped', data: groupedArray }; // 그룹화된 데이터
};