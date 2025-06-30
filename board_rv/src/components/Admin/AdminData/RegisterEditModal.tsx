// 등록/수정 모달 컴포넌트 (팀별 동적 폼 포함)
// 폼 데이터 상태 관리 및 유효성 검사, 제출/취소 처리

import React, { useState, useEffect } from "react";
import TeamFormDynamic from "./TeamFormDynamic";
import "../../../styles/AdminDataModal.css";

interface RegisterEditModalProps {
  visible: boolean;
  team: "dev" | "biz" | "security";
  initialData?: Record<string, any>;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
}

const RegisterEditModal: React.FC<RegisterEditModalProps> = ({
  visible,
  team,
  initialData,
  onClose,
  onSubmit,
}) => {
  // 폼 데이터 상태
  const [formData, setFormData] = useState<Record<string, any>>({});

  // 초기 데이터 변경 시 폼 데이터 동기화
  useEffect(() => {
    setFormData(initialData || {});
  }, [initialData]);

  // 모달이 닫힐 때 폼 데이터 초기화
  useEffect(() => {
    if (!visible) {
      setFormData({});
    }
  }, [visible]);

  if (!visible) return null;

  // 제출 시 회사명 유효성 검사(개발/보안팀만)
  const handleSubmit = async () => {
    if (team === "dev" || team === "security") {
      try {
        const res = await fetch("/api/biz");
        const data = await res.json();
        const bizCompanies = data.biz || [];

        const isValid = bizCompanies.some(
          (c: any) => c.company_name === formData.company_name
        );

        if (!isValid) {
          alert("사업팀에 등록된 회사명만 선택할 수 있습니다.");
          return;
        }
      } catch (err) {
        alert("회사 목록을 확인할 수 없습니다.");
        return;
      }
    }

    onSubmit(formData);
  };

  // 팀명 한글 변환 맵
  const teamLabelMap: Record<string, string> = {
    dev: "개발",
    biz: "사업",
    security: "보안",
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-content">
        <div className="admin-modal-title">
          {initialData && Object.keys(initialData).length > 0 ? "수정" : "등록"} - {teamLabelMap[team]} 팀
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <TeamFormDynamic
            team={team}
            initialData={initialData || {}}
            onChange={setFormData}
          />
          <div className="admin-modal-btn-row">
            <button type="submit" className="admin-modal-btn">
              {initialData && Object.keys(initialData).length > 0 ? "수정" : "등록"}
            </button>
            <button type="button" className="admin-modal-btn cancel" onClick={onClose}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterEditModal;
