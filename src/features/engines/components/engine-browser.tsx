import { useMemo, useRef, useState } from "react";
import { EngineGlobe } from "./engine-globe";
import { EnginePanel } from "./engine-panel";
import {
  EngineDataError,
  parseEngineFile,
  type EngineDataset,
  type EngineRecord,
} from "../lib/parse-engines";

type Phase = "empty" | "parsing" | "ready" | "error";

const ERROR_MESSAGES: Record<string, string> = {
  PARSE_FAILED: "数据解析失败：文件不是有效的 GeoJSON / JSON 文本。",
  NO_FEATURE_COLLECTION: "无法识别发动机数据：缺少 GeoJSON FeatureCollection。",
  NO_ENGINE_RECORDS: "无法识别发动机数据：没有找到有效的发动机点位。",
  EMPTY_FILE: "文件内容为空。",
};

const ERROR_TITLE = "INVALID ENGINE DATA";

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={accent ? "engine-stat is-accent" : "engine-stat"}>
      <span className="engine-stat-value">{value}</span>
      <span className="engine-stat-label">{label}</span>
    </div>
  );
}

export function EngineBrowser() {
  const [phase, setPhase] = useState<Phase>("empty");
  const [dataset, setDataset] = useState<EngineDataset | null>(null);
  const [datasetKey, setDatasetKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parseStep, setParseStep] = useState("");
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");
  const [engineType, setEngineType] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<{
    lng: number;
    lat: number;
    key: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selected = dataset && selectedId ? dataset.byId.get(selectedId) ?? null : null;

  const filtered = useMemo(() => {
    if (!dataset) return [];
    return dataset.engines.filter(
      (engine) =>
        (!continent || engine.continent === continent) &&
        (!country || engine.country === country) &&
        (!status || engine.status === status) &&
        (!engineType || engine.engineType === engineType),
    );
  }, [dataset, continent, country, status, engineType]);

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!dataset || needle === "") return [];
    const hits: EngineRecord[] = [];
    for (const engine of dataset.engines) {
      if (engine.searchBlob.includes(needle)) {
        hits.push(engine);
        if (hits.length >= 12) break;
      }
    }
    return hits;
  }, [dataset, query]);

  const nextFrame = () =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, 30);
    });

  const openPicker = () => fileInputRef.current?.click();

  const handleFile = async (file: File) => {
    setPhase("parsing");
    setErrorMessage(null);
    setParseStep("READING ENGINE DATA FILE ...");
    await nextFrame();
    try {
      const text = await file.text();
      setParseStep("PARSING ENGINE NETWORK ...");
      await nextFrame();
      const parsed = parseEngineFile(text, file.name);
      setParseStep("BUILDING ENGINE INDEX ...");
      await nextFrame();
      setDataset(parsed);
      setDatasetKey((key) => key + 1);
      setContinent("");
      setCountry("");
      setStatus("");
      setEngineType("");
      setQuery("");
      setSelectedId(null);
      setPhase("ready");
    } catch (error) {
      if (error instanceof EngineDataError) {
        setErrorMessage(ERROR_MESSAGES[error.message] ?? ERROR_MESSAGES.NO_ENGINE_RECORDS);
      } else {
        setErrorMessage("数据解析失败：读取文件时发生未知错误。");
      }
      setPhase("error");
    }
  };

  const selectEngine = (engine: EngineRecord) => setSelectedId(engine.id);

  const focusEngine = (engine: EngineRecord) => {
    setSelectedId(engine.id);
    setQuery("");
    setFocusTarget({ lng: engine.lng, lat: engine.lat, key: Date.now() });
  };

  const resetFilters = () => {
    setContinent("");
    setCountry("");
    setStatus("");
    setEngineType("");
  };

  return (
    <div className="ueg-engines-page">
      <section className="head engine-head">
        <div className="engine-head-main">
          <div className="crumb">UEG / GLOBAL ENGINE NETWORK / BROWSER</div>
          <h1>
            发动机浏览器 <span>ENGINE BROWSER</span>
          </h1>
          <p className="intro">
            UEG 全球行星发动机网络监控 / 档案终端。开发阶段：数据文件仅在当前
            浏览器内存中读取，不上传、不落库，刷新后需重新选择。
          </p>
        </div>
        {dataset && phase === "ready" ? (
          <div className="engine-head-stats">
            <StatBlock label="ENGINES" value={dataset.engines.length.toLocaleString("en-US")} />
            <StatBlock label="COUNTRIES" value={String(dataset.countries.length)} />
            <StatBlock label="CONTINENTS" value={String(dataset.continents.length)} />
            <StatBlock
              label="VISIBLE NODES"
              value={filtered.length.toLocaleString("en-US")}
              accent
            />
          </div>
        ) : null}
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json,.csv"
        className="engine-file-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />

      {phase === "empty" ? (
        <section className="engine-welcome">
          <span className="engine-kicker">PUBLIC ARCHIVE / ENGINE DATABASE</span>
          <h2 className="engine-welcome-en">UEG GLOBAL ENGINE NETWORK</h2>
          <p className="engine-welcome-zh">全球行星发动机网络</p>
          <div className="engine-welcome-state">NO DATA SOURCE LOADED</div>
          <p className="engine-welcome-desc">
            请选择本地生成器输出的发动机数据文件。页面将在浏览器内解析
            GeoJSON，并把全部发动机节点渲染到地球模型上。
          </p>
          <button type="button" className="engine-primary-btn" onClick={openPicker}>
            选择发动机数据文件
          </button>
          <p className="engine-welcome-hint">
            支持 .geojson / .json / .csv · 纯前端读取 · 无后端请求 · 不写入任何存储
          </p>
        </section>
      ) : null}

      {phase === "parsing" ? (
        <section className="engine-loading">
          <div className="engine-loading-scan" aria-hidden="true" />
          <p className="engine-loading-title">ENGINE NETWORK INITIALIZING ...</p>
          <p className="engine-loading-step">
            <span className="engine-loading-prompt">&gt;</span> {parseStep}
            <span className="engine-loading-caret" aria-hidden="true" />
          </p>
          <div className="engine-loading-bar">
            <span />
          </div>
        </section>
      ) : null}

      {phase === "error" ? (
        <section className="engine-error">
          <span className="engine-error-badge">{ERROR_TITLE}</span>
          <p className="engine-error-text">{errorMessage}</p>
          <p className="engine-error-hint">
            支持 GeoJSON FeatureCollection（Point）/ JSON / CSV，例如
            engines.geojson。
          </p>
          <button type="button" className="engine-primary-btn" onClick={openPicker}>
            重新选择数据文件
          </button>
        </section>
      ) : null}

      {phase === "ready" && dataset ? (
        <>
          <div className="engine-toolbar">
            <button type="button" className="engine-file-btn" onClick={openPicker}>
              数据文件：{dataset.fileName} <span aria-hidden="true">⇪</span>
            </button>

            <div className="engine-search">
              <input
                type="search"
                value={query}
                placeholder="搜索发动机：编号 / 名称 / 俗称 / 国家 …"
                onChange={(event) => setQuery(event.target.value)}
                aria-label="搜索发动机"
              />
              {searchResults.length > 0 ? (
                <ul className="engine-search-results">
                  {searchResults.map((engine) => (
                    <li key={engine.id}>
                      <button
                        type="button"
                        onClick={() => focusEngine(engine)}
                      >
                        <span className="engine-search-name">
                          {engine.commonName ?? engine.name}
                        </span>
                        <span className="engine-search-meta">
                          {engine.id} · {engine.countryName}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="engine-chips">
              <button
                type="button"
                className={continent === "" ? "chip active" : "chip"}
                onClick={() => setContinent("")}
              >
                全部
              </button>
              {dataset.continents.map((entry) => (
                <button
                  key={entry.code}
                  type="button"
                  className={continent === entry.code ? "chip active" : "chip"}
                  onClick={() => setContinent(entry.code)}
                >
                  {entry.name} {entry.count.toLocaleString("en-US")}
                </button>
              ))}
            </div>

            <select
              className="engine-select"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              aria-label="按国家筛选"
            >
              <option value="">全部国家</option>
              {dataset.countries.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.name}（{entry.count}）
                </option>
              ))}
            </select>

            {dataset.statuses.length > 0 ? (
              <select
                className="engine-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="按状态筛选"
              >
                <option value="">全部状态</option>
                {dataset.statuses.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.code}（{entry.count}）
                  </option>
                ))}
              </select>
            ) : null}

            {dataset.types.length > 0 ? (
              <select
                className="engine-select"
                value={engineType}
                onChange={(event) => setEngineType(event.target.value)}
                aria-label="按类型筛选"
              >
                <option value="">全部类型</option>
                {dataset.types.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.code}（{entry.count}）
                  </option>
                ))}
              </select>
            ) : null}

            {continent || country || status || engineType ? (
              <button type="button" className="engine-reset" onClick={resetFilters}>
                重置筛选 ×
              </button>
            ) : null}
          </div>

          <div className="engine-layout" data-panel={selected ? "open" : "closed"}>
            <div className="engine-map">
              <EngineGlobe
                engines={filtered}
                datasetKey={String(datasetKey)}
                selected={selected}
                onSelect={selectEngine}
                focusTarget={focusTarget}
              />
            </div>
            {selected ? (
              <EnginePanel engine={selected} onClose={() => setSelectedId(null)} />
            ) : null}
          </div>

          <p className="engine-statusline">
            {dataset.engines.length.toLocaleString("en-US")} ENGINE NODES LOADED ·{" "}
            {filtered.length.toLocaleString("en-US")} VISIBLE · READY
          </p>
        </>
      ) : null}
    </div>
  );
}
