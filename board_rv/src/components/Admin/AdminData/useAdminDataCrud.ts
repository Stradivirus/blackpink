// 관리자 데이터 CRUD 및 선택/모달 상태 관리 커스텀 훅
// 등록, 수정, 삭제, 선택 등 테이블 행의 상태와 동작을 통합 관리

import { useState, useEffect } from "react";
import { getCrudEndpoint } from "../../../api/urls";

// CRUD 및 선택/모달 상태를 관리하는 커스텀 훅
export function useAdminDataCrud(selectedTeam: string, fetchData?: () => void) {
  // 선택된 행(checkbox) 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // 등록/수정 모달 표시 여부
  const [modalVisible, setModalVisible] = useState(false);
  // 모달에 전달할 초기 데이터(수정 시 사용)
  const [modalInitialData, setModalInitialData] = useState<Record<string, any> | null | undefined>(undefined);

  // 팀별 CRUD API 엔드포인트
  const endpoint = getCrudEndpoint(selectedTeam);

  // 팀 변경 시 선택된 행 초기화
  useEffect(() => { setSelectedIds(new Set()); }, [selectedTeam]);

  // 등록 버튼 클릭 시 모달 오픈(초기값 없음)
  const handleRegisterClick = () => {
    setModalInitialData(null);
    setModalVisible(true);
  };

  // 수정 버튼 클릭 시 선택된 행이 1개일 때만 모달 오픈
  const handleEditClick = (selectedIds: Set<string>, filteredData: any[]) => {
    if (selectedIds.size > 1) {
      alert("하나의 행만 선택해주세요.");
      return;
    } else if (selectedIds.size == 0) {
      alert("행을 선택해주세요.");
      return;
    }
    // 선택된 행의 데이터 찾기
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

  // 등록/수정 제출 처리
  const handleSubmit = async (formData: any) => {
    try {
      // 빈 문자열을 null로 변환, 날짜 필드는 빈 값이면 undefined
      const processedData: any = {};
      Object.entries(formData).forEach(([k, v]) => {
        if (v === "") {
          // 날짜 필드는 undefined로 처리
          if (k.includes("date")) {
            // undefined로 보내면 FastAPI에서 필드 자체가 누락됨
          } else {
            processedData[k] = null;
          }
        } else {
          processedData[k] = v;
        }
      });

      if (modalInitialData) {
        // 수정 요청
        const itemId =
          typeof modalInitialData._id === "object" && "$oid" in modalInitialData._id
            ? modalInitialData._id.$oid
            : typeof modalInitialData._id === "string"
            ? modalInitialData._id
            : String(modalInitialData._id);
        if (!itemId) throw new Error("수정할 데이터 ID가 없습니다.");

        const response = await fetch(`${endpoint}/${itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(processedData),
        });

        await response.json();

        if (!response.ok) throw new Error("수정 실패");
      } else {
        // 등록 요청
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(processedData),
        });

        await response.json();

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

  // 삭제 처리
  const handleDeleteClick = async (selectedIds: Set<string>) => {
    if (selectedIds.size === 0) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }
    const idsToDelete = Array.from(selectedIds);
    try {
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

  // 훅에서 제공하는 상태와 함수 반환
  return {
    selectedIds,
    setSelectedIds,
    modalVisible,
    setModalVisible,
    modalInitialData,
    setModalInitialData,
    handleRegisterClick,
    handleEditClick,
    handleSubmit,
    handleDeleteClick,
  };
}