// 테이블 UI용 드롭다운/체크박스/검색 인풋 컴포넌트 모음
// 필터 및 검색 등 인터랙션 UI 제공

// DropdownButton: 드롭다운 버튼 컴포넌트
export const DropdownButton = ({ label, selected, onClick, children, disabled }: any) => (
  <div className="admin-data-table-dropdown">
    <button
      onClick={onClick}
      className={`admin-data-table-btn${selected ? " selected" : ""}`}
      type="button"
      disabled={disabled}
      style={disabled ? { cursor: "not-allowed", color: "#aaa" } : undefined}
    >
      {label}
    </button>
    {children}
  </div>
);

// FilterCheckboxList: 체크박스 리스트로 다중 필터 선택
export const FilterCheckboxList = ({ values, selected, onChange, labelRender }: any) => (
  <div className="admin-data-table-dropdown-list" style={{ minWidth: 160, maxHeight: 240, marginTop: 4 }}>
    <button
      onClick={() => onChange([])}
      className={`admin-data-table-btn${selected.length === 0 ? " selected" : ""}`}
      type="button"
    >
      모두 보기
    </button>
    {values.map((value: string) => (
      <label key={value} className="admin-data-table-dropdown-checkbox-label">
        <input
          type="checkbox"
          checked={selected.includes(value)}
          onChange={() => onChange(
            selected.includes(value)
              ? selected.filter((v: string) => v !== value)
              : [...selected, value]
          )}
          style={{ marginRight: 8 }}
        />
        {labelRender ? labelRender(value) : value}
      </label>
    ))}
  </div>
);

// CompanySearchInput: 회사명 검색 인풋
export const CompanySearchInput = ({ value, onChange }: any) => (
  <div className="admin-data-table-company-search">
    <input
      type="text"
      placeholder="회사명 검색"
      value={value}
      onChange={onChange}
    />
  </div>
);