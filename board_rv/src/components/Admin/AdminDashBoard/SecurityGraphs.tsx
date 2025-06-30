// 보안팀 대시보드 그래프 이미지 뷰어 컴포넌트
// 위협유형별/투입인원 등 그래프 이미지 로딩, 에러처리, 확대 모달 지원

import * as React from "react";
import { API_URLS } from "../../../api/urls";
import { threatTypes } from "../../../constants/dataconfig";

export type GraphType = {
  type: string;
  label: string;
};

type SecurityGraphsProps = {
  graphTypes: GraphType[];
};

// 월별 위협유형 그래프(자동 슬라이드)
const ThreatMGraph: React.FC<{ onImgClick?: (src: string, alt: string) => void }> = ({ onImgClick }) => {
  const [idx, setIdx] = React.useState(0);
  const [imgLoaded, setImgLoaded] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % threatTypes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    setImgLoaded(false); // 이미지가 바뀔 때마다 로딩 상태 초기화
  }, [idx]);

  const currentType = threatTypes[idx];
  const imgSrc = `${API_URLS.SECURITY_GRAPH}/threat_m?threat_type=${encodeURIComponent(currentType)}`;

  return (
    <div style={{ minHeight: 340, position: 'relative' }}>
      <h4>{currentType} 월별 침해 현황</h4>
      {!imgLoaded && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 60, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
        }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #ccc', borderTop: '4px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      <img
        src={imgSrc}
        alt={currentType}
        style={{ minWidth: 350, maxWidth: 500, minHeight: 240, cursor: onImgClick ? 'zoom-in' : undefined, opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.2s' }}
        onClick={onImgClick ? () => onImgClick(imgSrc, `${currentType} 월별 침해 현황`) : undefined}
        onLoad={() => setImgLoaded(true)}
      />
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const threatTypeList = ["전체보기", ...threatTypes];

// 위협유형별 처리기간/투입인원 그래프
const ManpowerGraph: React.FC<{ onImgClick?: (src: string, alt: string) => void }> = ({ onImgClick }) => {
  const [selectedType, setSelectedType] = React.useState("전체보기");
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const imgSrc = `${API_URLS.SECURITY_GRAPH}/manpower?threat_type=${encodeURIComponent(selectedType)}&t=${Date.now()}`;

  return (
    <div style={{ minHeight: 340, position: 'relative' }}>
      <h4>처리기간 vs 투입인원 (위협유형별)</h4>
      <div style={{ marginBottom: 8 }}>
        <label htmlFor="threatTypeSelect">위협유형 선택: </label>
        <select
          id="threatTypeSelect"
          value={selectedType}
          onChange={e => { setSelectedType(e.target.value); setImgLoaded(false); }}
        >
          {threatTypeList.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      {!imgLoaded && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 60, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
        }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #ccc', borderTop: '4px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      <img
        src={imgSrc}
        alt={`처리기간 vs 투입인원 (${selectedType})`}
        style={{ minWidth: 350, maxWidth: 500, minHeight: 240, cursor: onImgClick ? 'zoom-in' : undefined, opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.2s' }}
        onClick={onImgClick ? () => onImgClick(imgSrc, `처리기간 vs 투입인원 (${selectedType})`) : undefined}
        onLoad={() => setImgLoaded(true)}
      />
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// 보안팀 대시보드 그래프 전체 뷰어
const SecurityGraphs: React.FC<SecurityGraphsProps> = ({ graphTypes }) => {
  const [modalImg, setModalImg] = React.useState<string | null>(null);
  const [modalAlt, setModalAlt] = React.useState<string>("");

  const handleImgClick = (src: string, alt: string) => {
    setModalImg(src);
    setModalAlt(alt);
  };

  const closeModal = () => setModalImg(null);

  return (
    <>
      <div className="admin-correlation-grid">
        {graphTypes.map((g) =>
          g.type === "threat_m" ? (
            <div
              key={g.type}
              className="admin-card admin-correlation-card"
              style={{ minWidth: 350, maxWidth: 500 }}
            >
              <ThreatMGraph onImgClick={handleImgClick} />
            </div>
          ) : g.type === "manpower" ? (
            <div
              key={g.type}
              className="admin-card admin-correlation-card"
              style={{ minWidth: 350, maxWidth: 500 }}
            >
              <ManpowerGraph onImgClick={handleImgClick} />
            </div>
          ) : (
            <div
              key={g.type}
              className="admin-card admin-correlation-card"
              style={{ minWidth: 350, maxWidth: 500 }}
            >
              <h4 className="admin-card-title">{g.label}</h4>
              <div className="admin-image-container">
                <img
                  src={`${API_URLS.SECURITY_GRAPH}/${g.type}`}
                  alt={g.label}
                  onClick={() => handleImgClick(`${API_URLS.SECURITY_GRAPH}/${g.type}`, g.label)}
                  style={{ cursor: "zoom-in", maxWidth: "100%" }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>
          )
        )}
      </div>
      {modalImg && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={closeModal}
        >
          <img
            src={modalImg}
            alt={modalAlt}
            style={{ maxWidth: "90vw", maxHeight: "90vh", background: "#fff", padding: 16, borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default SecurityGraphs;