import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URLS } from "../../api/urls";  // api.ts 경로에 맞게 조정
import type { Company } from "../../types/Company";


const CompanyTable: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    axios
      .get(API_URLS.COMPANIES)  // 여기서 API_URLS 사용
      .then((res) => setCompanies(res.data))
      .catch((err) => console.error("회사 정보 로드 실패:", err));
  }, []);

  return (
    <div>
      <h2>안녕하세요 00팀 000님, 관리자 페이지입니다</h2>
      <table border={1} cellPadding={8} style={{ marginTop: "20px", width: "100%" }}>
        <thead>
          <tr>
            <th></th>
            <th>회사명</th>
            <th>업종</th>
            <th>계약플랜</th>
            <th>계약 시작일</th>
            <th>계약 종료일</th>
            <th>계약상태</th>
            <th>담당자 이름</th>
            <th>담당자 연락처</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id}>
              <td><input type="checkbox" /></td>
              <td>{company.company_name}</td>
              <td>{company.industry}</td>
              <td>{company.plan}</td>
              <td>{new Date(company.contract_start).toLocaleDateString()}</td>
              <td>{new Date(company.contract_end).toLocaleDateString()}</td>
              <td>{company.status}</td>
              <td>{company.manager_name}</td>
              <td>{company.manager_phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{
        position: "fixed",
        bottom: "50px",
        right: "50px",
        display: "flex",
        gap: "10px"
      }}>
        <button style={{ fontSize: "16px", padding: "8px 16px" }} onClick={() => alert("등록 버튼 클릭됨")}>등록</button>
        <button style={{ fontSize: "16px", padding: "8px 16px" }} onClick={() => alert("수정 버튼 클릭됨")}>수정</button>
      </div>
    </div>
  );
};

export default CompanyTable;
