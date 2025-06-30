// src/utils/dataProcessing.ts

// 데이터 그룹화 유틸 함수

// 그룹화된 데이터 항목 타입
interface GroupedDataItem {
  groupKey: string;   // 그룹의 키 값
  items: any[];       // 해당 그룹에 속하는 데이터 배열
  count: number;      // 그룹 내 데이터 개수
}

// 그룹화 처리 결과 타입
interface ProcessedDataResult {
  type: 'flat' | 'grouped';           // flat: 그룹화X, grouped: 그룹화O
  data: any[] | GroupedDataItem[];    // 결과 데이터
}


//데이터를 특정 컬럼 기준으로 그룹화

export const getGroupedData = (dataToGroup: any[], columnKey: string | null): ProcessedDataResult => {
  // 컬럼키 없거나 데이터 없으면 원본(flat) 반환
  if (!columnKey || !dataToGroup || dataToGroup.length === 0) {
    return { type: 'flat', data: dataToGroup };
  }

  // 그룹핑용 객체 생성
  const grouped: { [key: string]: any[] } = {};
  dataToGroup.forEach(row => {
    // 그룹화 기준 값, 없으면 'N/A'
    const keyValue = row[columnKey] || 'N/A';
    if (!grouped[keyValue]) {
      grouped[keyValue] = [];
    }
    grouped[keyValue].push(row);
  });

  // 그룹핑 결과를 배열로 변환
  const groupedArray: GroupedDataItem[] = Object.keys(grouped).map(key => ({
    groupKey: key,             // 그룹 키
    items: grouped[key],       // 해당 그룹 데이터
    count: grouped[key].length // 그룹 내 개수
  }));

  // 그룹화된 데이터 반환
  return { type: 'grouped', data: groupedArray };
};