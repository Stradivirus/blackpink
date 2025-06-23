import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import TeamFormDynamic from "./TeamFormDynamic";  // 새 컴포넌트 import

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

  if (!visible) return null;

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Modal open={visible} onClose={onClose}>
      <h2>{initialData ? "수정" : "등록"} - {team} 팀</h2>

      <TeamFormDynamic team={team} initialData={initialData} onChange={setFormData} />

      <button onClick={handleSubmit}>{initialData ? "수정" : "등록"}</button>
      <button onClick={onClose}>취소</button>
    </Modal>
  );
};

export default RegisterEditModal;
