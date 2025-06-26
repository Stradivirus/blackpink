// src/components/Admin/AdminDataTable.tsx
import React, { useMemo } from "react";
import type { AdminDataTableProps } from "../../types/users";
import RegisterEditModal from "./AdminData/RegisterEditModal";
import { useAdminDataCrud } from "./AdminData/useAdminDataCrud";
import { useAdminDataTableFilters } from "./AdminData/useAdminDataTableFilters";
import { DropdownButton, FilterCheckboxList, CompanySearchInput } from "./AdminData/useAdminDataUI";

const AdminDataTable: React.FC<AdminDataTableProps> = ({
  data,
  columns,
  loading,
  selectedTeam,
  selectedTeamLabel,
  fetchData,
}) => {
  // 필터 관련 훅
  const {
    dateColumns,
    dateFilterColumn,
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    filters,
    setFilters,
    companyNameQuery,
    setCompanyNameQuery,
    activeDropdown,
    setActiveDropdown,
    filterableColumns,
    uniqueYears,
    uniqueMonths,
    getFilterValues,
    filteredData,
    handleResetFilters,
    handleDateColumnToggle,
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    paginationPages,
    startPage,
    endPage,
  } = useAdminDataTableFilters(data, columns, selectedTeam);

  // CRUD 및 선택 관련 훅
  const {
    modalVisible,
    setModalVisible,
    modalInitialData,
    // setModalInitialData,
    handleRegisterClick,
    handleEditClick,
    handleSubmit,
    handleDeleteClick,
    selectedIds,
    setSelectedIds,
  } = useAdminDataCrud(selectedTeam, fetchData);

  // 전체 선택 체크박스
  const isAllSelected =
    filteredData.length > 0 &&
    filteredData.every((row, idx) =>
      selectedIds.has(getRowId(row, idx))
    );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredData.map((row, idx) => getRowId(row, idx));
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  // 실제 테이블에 보여줄 컬럼
  const getVisibleColumns = useMemo(() => columns.filter((col) => col.key !== "hidden_column"), [columns]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="admin-data-table-container">
      <h2 className="admin-data-table-title">{selectedTeamLabel} 데이터</h2>

      {/* 날짜 필터 그룹 */}
      <div className="admin-data-table-date-filter-group">
        {dateColumns.length > 0 && (
          <DropdownButton
            label={dateColumns.find((col) => col.key === dateFilterColumn)?.label ?? "날짜 컬럼 선택"}
            selected={true}
            onClick={handleDateColumnToggle}
          />
        )}
        <DropdownButton
          label={`${yearFilter ?? "연도 선택"} ▼`}
          selected={!!yearFilter}
          onClick={() => setActiveDropdown((prev) => (prev === "year" ? null : "year"))}
        >
          {activeDropdown === "year" && (
            <div className="admin-data-table-dropdown-list">
              <button
                className={`admin-data-table-btn${yearFilter === null ? " selected" : ""}`}
                type="button"
                onClick={() => {
                  setYearFilter(null);
                  setMonthFilter(null);
                  setActiveDropdown(null);
                }}
              >
                모두 보기
              </button>
              {uniqueYears.map((y) => (
                <button
                  key={y}
                  className={`admin-data-table-btn${yearFilter === y ? " selected" : ""}`}
                  type="button"
                  onClick={() => {
                    setYearFilter(y);
                    setMonthFilter(null);
                    setActiveDropdown(null);
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </DropdownButton>
        <DropdownButton
          label={`${monthFilter ? monthFilter + "월" : "월 선택"} ▼`}
          selected={!!monthFilter}
          onClick={() => {
            if (!yearFilter) return;
            setActiveDropdown((prev) => (prev === "month" ? null : "month"));
          }}
          disabled={!yearFilter}
        >
          {activeDropdown === "month" && yearFilter && (
            <div className="admin-data-table-dropdown-list">
              <button
                className={`admin-data-table-btn${monthFilter === null ? " selected" : ""}`}
                type="button"
                onClick={() => {
                  setMonthFilter(null);
                  setActiveDropdown(null);
                }}
              >
                모두 보기
              </button>
              {uniqueMonths.map((m) => (
                <button
                  key={m}
                  className={`admin-data-table-btn${monthFilter === m ? " selected" : ""}`}
                  type="button"
                  onClick={() => {
                    setMonthFilter(m);
                    setActiveDropdown(null);
                  }}
                >
                  {m}월
                </button>
              ))}
            </div>
          )}
        </DropdownButton>
      </div>

      {/* 다중 필터 영역 */}
      <div className="admin-data-table-multi-filter-row">
        <div className="admin-data-table-multi-filter-group">
          {/* 왼쪽: 필터 버튼들 */}
          {filterableColumns.map((col) => {
            const selected = filters[col.key] || [];
            return (
              <DropdownButton
                key={col.key}
                label={
                  col.key === "company_id" && selectedTeam === "dev"
                    ? "회사코드 ▼"
                    : `${col.label} ▼`
                }
                selected={selected.length > 0}
                onClick={() => setActiveDropdown((prev) => (prev === col.key ? null : col.key))}
              >
                {activeDropdown === col.key && (
                  <FilterCheckboxList
                    values={getFilterValues(col.key)}
                    selected={selected}
                    onChange={(newVals: string[]) => {
                      setFilters((prev) => ({ ...prev, [col.key]: newVals }));
                      setActiveDropdown(null);
                    }}
                    labelRender={
                      col.key === "company_id"
                        ? (value: string) => (value !== "" ? value : "(비어있음)")
                        : undefined
                    }
                  />
                )}
              </DropdownButton>
            );
          })}

          {/* 초기화 버튼 */}
          {(Object.values(filters).some((vals) => vals.length > 0) ||
            yearFilter !== null ||
            monthFilter !== null) && (
            <button
              onClick={handleResetFilters}
              className="admin-data-table-reset-btn"
              type="button"
            >
              초기화
            </button>
          )}
        </div>

        {["biz", "dev", "security"].includes(selectedTeam) && ( 
          <div className="admin-data-table-search-area-relative">
            <div className="total-count-independent">
              총 개수 : {filteredData.length}개
            </div>
              <div className="admin-data-table-company-search-wrapper">
                <CompanySearchInput
                  value={companyNameQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCompanyNameQuery(e.target.value)
                  }
                />
              </div>
          </div>
        )}
      </div>



      {/* 테이블 렌더링 */}
      <table className="admin-data-table-table">
        <colgroup>
          <col style={{ width: "36px" }} />
          {getVisibleColumns.map((col) => {
            if (selectedTeam === "security") {
              if (col.key === "server_type") return <col key={col.key} style={{ width: "140px" }} />;
              if (col.key === "status") return <col key={col.key} style={{ width: "90px" }} />;
              if (col.key === "handler_count") return <col key={col.key} style={{ width: "100px" }} />;
            }
            if (selectedTeam === "dev") {
              if (col.key === "company_id") return <col key={col.key} style={{ width: "100px" }} />;
              if (col.key === "start_date") return <col key={col.key} style={{ width: "110px" }} />;
              if (col.key === "end_date_fin") return <col key={col.key} style={{ width: "110px" }} />;
              if (col.key === "os") return <col key={col.key} style={{ width: "100px" }} />;
              if (col.key === "error") return <col key={col.key} style={{ width: "150px" }} />;
              if (col.key === "handler_count") return <col key={col.key} style={{ width: "100px" }} />;
            }
            return <col key={col.key} />;
          })}
        </colgroup>
        <thead>
          <tr>
            {/* 체크박스 전체 선택 */}
            <th>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            {getVisibleColumns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, idx) => {
            const rowId = getRowId(row, idx);
            return (
              <tr key={rowId}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(getRowId(row, idx))}
                    onChange={(e) => {
                      const idStr = getRowId(row, idx);
                      setSelectedIds((prev) => {
                        const newSet = new Set(prev);
                        if (e.target.checked) {
                          newSet.add(idStr);
                        } else {
                          newSet.delete(idStr);
                        }
                        return newSet;
                      });
                    }}
                  />
                </td>
                {getVisibleColumns.map((col) => (
                  <td key={col.key}>{getDisplayValue(row, col.key)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="admin-data-table-pagination">
        {startPage > 1 && (
          <button
            className="admin-data-table-page-btn-group-nav"
            onClick={() => setCurrentPage(startPage - 1)}
          >
            &lt;
          </button>
        )}

        {paginationPages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`admin-data-table-page-btn${
              currentPage === page ? " active" : ""
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <button
            className="admin-data-table-page-btn-group-nav"
            onClick={() => setCurrentPage(endPage + 1)}
          >
            &gt;
          </button>
        )}
      </div>

      {/* 우측 하단 고정 버튼 */}
      <div className="admin-data-table-fixed-buttons">
        <button
          className="admin-data-table-fixed-btn"
          onClick={handleRegisterClick}
        >
          등록
        </button>
        <button
          className="admin-data-table-fixed-btn"
          onClick={() => handleEditClick(selectedIds, filteredData)}
        >
          수정
        </button>
        <button
          className="admin-data-table-fixed-btn"
          onClick={() => handleDeleteClick(selectedIds)}
          disabled={selectedIds.size === 0}
        >
          삭제
        </button>
      </div>

      {modalVisible && (
        <RegisterEditModal
          visible={modalVisible}
          team={selectedTeam}
          initialData={modalInitialData || undefined}
          onClose={() => setModalVisible(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

// row의 고유 식별자 생성 함수 (중복 방지)
function getRowId(row: any, idx: number) {
  if (row._id) {
    if (typeof row._id === "object" && "$oid" in row._id) return row._id.$oid;
    if (typeof row._id === "string") return row._id;
  }
  if (row.id) return row.id;
  if (row.company_id) return row.company_id;
  return idx.toString();
}

// 셀 값 가공 함수
function getDisplayValue(row: any, key: string) {
  if (key === "company_id" && row.company_id) return row.company_id;
  if (key === "company_name" && row.company_name) return row.company_name;
  if (key.toLowerCase().includes("date") && row[key]) {
    const d = new Date(row[key]);
    if (!isNaN(d.getTime())) return d.toLocaleDateString();
  }
  return row[key] ?? "";
}

export default AdminDataTable;
