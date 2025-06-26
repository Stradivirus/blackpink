import { useState, useEffect } from "react";
import { getCrudEndpoint } from "../../../api/urls";

export function useAdminDataCrud(selectedTeam: string, fetchData?: () => void) {
  // 선택된 행(checkbox) 관리 상태도 여기서!
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<Record<string, any> | null | undefined>(undefined);

  const endpoint = getCrudEndpoint(selectedTeam);

  // 팀 이동 시 체크박스 해제
  useEffect(() => { setSelectedIds(new Set()); }, [selectedTeam]);

  // 등록 버튼 클릭
  const handleRegisterClick = () => {
    setModalInitialData(null);
    setModalVisible(true);
  };

  // 수정 버튼 클릭
  const handleEditClick = (selectedIds: Set<string>, filteredData: any[]) => {
    if (selectedIds.size > 1) {
      alert("하나의 행만 선택해주세요.");
      return;
    } else if (selectedIds.size == 0) {
      alert("행을 선택해주세요.");
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

  // 등록/수정 제출
const handleSubmit = async (formData: any) => {
  try {
    console.log("handleSubmit 호출, formData:", formData);
    if (modalInitialData) {
      // 수정
      const itemId =
        typeof modalInitialData._id === "object" && "$oid" in modalInitialData._id
          ? modalInitialData._id.$oid
          : typeof modalInitialData._id === "string"
          ? modalInitialData._id
          : String(modalInitialData._id);
      if (!itemId) throw new Error("수정할 데이터 ID가 없습니다.");

      console.log("수정 요청, ID:", itemId);

      const response = await fetch(`${endpoint}/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      console.log("수정 응답 status:", response.status);
      const data = await response.json();
      console.log("수정 응답 데이터:", data);

      if (!response.ok) throw new Error("수정 실패");
    } else {
      // 등록
      console.log("등록 요청, endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      console.log("등록 응답 status:", response.status);
      const data = await response.json();
      console.log("등록 응답 데이터:", data);

      if (!response.ok) throw new Error("등록 실패");
    }
    alert("저장되었습니다.");
    setModalVisible(false);
    setSelectedIds(new Set());
    fetchData?.();
  } catch (error) {
    console.error("handleSubmit 에러:", error);
    alert("에러가 발생했습니다.");
  }
};


  // 삭제
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