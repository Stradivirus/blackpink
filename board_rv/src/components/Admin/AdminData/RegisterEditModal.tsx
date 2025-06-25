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
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    setFormData(initialData || {});
  }, [initialData]);

  // 모달이 닫힐 때 formData 초기화
  useEffect(() => {
    if (!visible) {
      setFormData({});
    }
  }, [visible]);

  if (!visible) return null;

  const handleSubmit = () => {
    onSubmit(formData);
  };

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
            initialData={initialData}
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
