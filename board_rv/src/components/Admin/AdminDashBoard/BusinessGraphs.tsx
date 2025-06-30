import * as React from "react";
import { API_URLS } from "../../../api/urls";
import { businessGraphTypes } from "../../../constants/dataconfig";

const BUSINESS_GRAPH_TYPES = businessGraphTypes;

const BusinessGraphs: React.FC = () => {
  const [imgLoaded, setImgLoaded] = React.useState<boolean[]>(Array(BUSINESS_GRAPH_TYPES.length).fill(false));
  const [imgKeys, setImgKeys] = React.useState<number[]>(BUSINESS_GRAPH_TYPES.map(() => Date.now()));
  const [modalImg, setModalImg] = React.useState<string | null>(null);
  const [modalAlt, setModalAlt] = React.useState<string>("");
  const [imgSrcs, setImgSrcs] = React.useState<(string | null)[]>(Array(BUSINESS_GRAPH_TYPES.length).fill(null));

  React.useEffect(() => {
    // 모든 이미지 src를 한 번에 할당
    setImgSrcs(
      BUSINESS_GRAPH_TYPES.map((g, idx) => `${API_URLS.BUSINESS_GRAPH}/${g.type}?t=${imgKeys[idx]}`)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgKeys]);

  const handleImgClick = (src: string, alt: string) => {
    setModalImg(src);
    setModalAlt(alt);
  };

  const closeModal = () => setModalImg(null);

  const handleImgLoad = (idx: number) => {
    setImgLoaded((prev) => {
      const arr = [...prev];
      arr[idx] = true;
      return arr;
    });
  };

  const handleImgError = (idx: number) => {
    setImgKeys((prev) => {
      const arr = [...prev];
      arr[idx] = Date.now();
      return arr;
    });
    setImgLoaded((prev) => {
      const arr = [...prev];
      arr[idx] = false;
      return arr;
    });
    // 재시도 시 src를 다시 할당 (1초 후)
    setTimeout(() => {
      setImgSrcs((prev) => {
        const arr = [...prev];
        arr[idx] = `${API_URLS.BUSINESS_GRAPH}/${BUSINESS_GRAPH_TYPES[idx].type}?t=${Date.now()}`;
        return arr;
      });
    }, 1000);
  };

  return (
    <>
      <div className="admin-correlation-grid">
        {BUSINESS_GRAPH_TYPES.map((g, idx) => (
          <div
            key={g.type}
            className="admin-card admin-correlation-card"
            style={{ minWidth: 350, maxWidth: 500 }}
          >
            <h4 className="admin-card-title">{g.label}</h4>
            <div className="admin-image-container" style={{ position: "relative" }}>
              {!imgLoaded[idx] && (
                <div style={{
                  position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
                  background: "#f8f9fa"
                }}>
                  <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #ccc', borderTop: '4px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              )}
              {imgSrcs[idx] && (
                <img
                  src={imgSrcs[idx] as string}
                  alt={g.label}
                  onClick={() => handleImgClick(imgSrcs[idx] as string, g.label)}
                  style={{ cursor: "zoom-in", maxWidth: "100%", opacity: imgLoaded[idx] ? 1 : 0, transition: 'opacity 0.2s', minHeight: 200 }}
                  onLoad={() => handleImgLoad(idx)}
                  onError={() => handleImgError(idx)}
                />
              )}
              <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
              `}</style>
            </div>
          </div>
        ))}
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

export default BusinessGraphs;
