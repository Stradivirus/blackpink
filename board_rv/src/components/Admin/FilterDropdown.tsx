// src/components/Admin/FilterDropdown.tsx
// 필터 드롭다운 UI 컴포넌트
import React from "react";

interface FilterDropdownProps {
  columnKey: string;
  uniqueValues: string[];
  selectedFilterValue: string | null;
  filterColumn: string | null;
  onFilterValueClick: (value: string | null) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  columnKey,
  uniqueValues,
  selectedFilterValue,
  filterColumn,
  onFilterValueClick,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        zIndex: 10,
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        minWidth: 150,
        maxHeight: 200,
        overflowY: "auto",
        marginTop: 5,
      }}
    >
      <button
        onClick={() => onFilterValueClick(null)}
        style={{
          width: "100%",
          padding: 8,
          border: "none",
          textAlign: "left",
          backgroundColor: selectedFilterValue === null && filterColumn === columnKey ? "#e6f7ff" : "transparent",
          cursor: "pointer",
          fontWeight: selectedFilterValue === null && filterColumn === columnKey ? "bold" : "normal",
        }}
      >
        모두 보기
      </button>
      {uniqueValues.map((value) => (
        <button
          key={value}
          onClick={() => onFilterValueClick(value)}
          style={{
            width: "100%",
            padding: 8,
            border: "none",
            textAlign: "left",
            backgroundColor: selectedFilterValue === value && filterColumn === columnKey ? "#e6f7ff" : "transparent",
            cursor: "pointer",
            fontWeight: selectedFilterValue === value && filterColumn === columnKey ? "bold" : "normal",
          }}
        >
          {value === "" ? "(비어있음)" : value}
        </button>
      ))}
    </div>
  );
};

export default FilterDropdown;
