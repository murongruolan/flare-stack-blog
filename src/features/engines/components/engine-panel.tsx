import type { EngineRecord } from "../lib/parse-engines";

interface EnginePanelProps {
  engine: EngineRecord;
  onClose: () => void;
}

function formatCoords(engine: EngineRecord): string {
  const lat = `${Math.abs(engine.lat).toFixed(4)} ${engine.lat >= 0 ? "N" : "S"}`;
  const lng = `${Math.abs(engine.lng).toFixed(4)} ${engine.lng >= 0 ? "E" : "W"}`;
  return `${lat} / ${lng}`;
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (value === null || value === "") return null;
  return (
    <div className="engine-row">
      <span className="engine-row-label">{label}</span>
      <span className="engine-row-value">{value}</span>
    </div>
  );
}

export function EnginePanel({ engine, onClose }: EnginePanelProps) {
  return (
    <aside className="engine-panel">
      <div className="engine-panel-top">
        <span className="engine-panel-kicker">
          ENGINE / {engine.id}
        </span>
        <button
          type="button"
          className="engine-panel-close"
          onClick={onClose}
          aria-label="关闭档案面板"
        >
          ×
        </button>
      </div>
      <h2 className="engine-panel-title">{engine.name}</h2>
      {engine.commonName ? (
        <p className="engine-panel-sub">{engine.commonName}</p>
      ) : null}
      <div className="engine-panel-rows">
        <Row label="ENGINE ID" value={engine.id} />
        <Row label="正式名称" value={engine.name} />
        <Row label="民间俗称" value={engine.commonName} />
        <Row
          label="国家"
          value={`${engine.countryName} · ${engine.country}`}
        />
        <Row label="地区" value={engine.region} />
        <Row label="大洲" value={engine.continentName} />
        <Row label="城市" value={engine.city} />
        <Row
          label="设计居住人口"
          value={
            engine.population === null
              ? null
              : engine.population.toLocaleString("en-US")
          }
        />
        <Row label="发动机状态" value={engine.status} />
        <Row label="发动机类型" value={engine.engineType} />
        <Row label="经纬度" value={formatCoords(engine)} />
      </div>
      <button type="button" className="engine-panel-cta">
        查看完整档案 <span aria-hidden="true">→</span>
      </button>
      <p className="engine-panel-note">
        PUBLIC ARCHIVE · 开发阶段档案接口未接入
      </p>
    </aside>
  );
}
