import { useEffect, useMemo, useRef, useState } from "react";
import { EngineGlobe } from "./engine-globe";
import { EnginePanel } from "./engine-panel";
import {
  EngineDataError,
  parseEngineFile,
  type EngineDataset,
  type EngineRecord,
} from "../lib/parse-engines";
import { ENGINE_DATA_URL, ENGINE_MODEL_URL } from "../lib/engine-assets";
import { cn } from "@/lib/utils";

type Phase = "loading" | "ready" | "error";

const ERROR_MESSAGES: Record<string, string> = {
  PARSE_FAILED: "数据解析失败：文件不是有效的 GeoJSON / JSON 文本。",
  NO_FEATURE_COLLECTION: "无法识别发动机数据：缺少 GeoJSON FeatureCollection。",
  NO_ENGINE_RECORDS: "无法识别发动机数据：没有找到有效的发动机点位。",
  EMPTY_FILE: "数据文件内容为空。",
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

export function EngineBrowser({
  dataUrl = ENGINE_DATA_URL,
  modelUrl = ENGINE_MODEL_URL,
  variant = "page",
  startWhenVisible = false,
}: {
  /** R2 数据文件 URL（后台「数据源」配置，SSR 注入；缺省用内置默认）。 */
  dataUrl?: string;
  modelUrl?: string;
  /** page = /engines 独立页（含页头统计）；home = 首页嵌入板块（仅工具栏+地图）。 */
  variant?: "page" | "home";
  /** true 时进入视口才开始拉取数据（首页嵌入，避免一进首页就拉 3MB）。 */
  startWhenVisible?: boolean;
} = {}) {
  const isEmbed = variant === "home";
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [dataset, setDataset] = useState<EngineDataset | null>(null);
  const [datasetKey, setDatasetKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parseStep, setParseStep] = useState("");
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [engineType, setEngineType] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<{
    lng: number;
    lat: number;
    key: number;
  } | null>(null);
  const reloadRef = useRef<(() => void) | null>(null);

  const selected = dataset && selectedId ? dataset.byId.get(selectedId) ?? null : null;

  const filtered = useMemo(() => {
    if (!dataset) return [];
    return dataset.engines.filter(
      (engine) =>
        (!continent || engine.continent === continent) &&
        (!country || engine.country === country) &&
        (!engineType || engine.engineType === engineType),
    );
  }, [dataset, continent, country, engineType]);

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

  // 从 R2 云端拉取发动机数据（经站点 /images/ 路由透出）
  const loadFromCloud = () => {
    setPhase("loading");
    setErrorMessage(null);
    setParseStep("FETCHING ENGINE NETWORK FROM CLOUD ...");

    const run = async () => {
      const nextFrame = () =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, 30);
        });
      try {
        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new EngineDataError("FETCH_FAILED");
        }
        setParseStep("PARSING ENGINE NETWORK ...");
        await nextFrame();
        const text = await response.text();
        const parsed = parseEngineFile(
          text,
          dataUrl.split("/").pop()?.split("?")[0] ?? "engines.geojson",
        );
        setParseStep("BUILDING ENGINE INDEX ...");
        await nextFrame();
        setDataset(parsed);
        setDatasetKey((key) => key + 1);
        setContinent("");
        setCountry("");
        setEngineType("");
        setQuery("");
        setSelectedId(null);
        setPhase("ready");
      } catch (error) {
        if (error instanceof EngineDataError) {
          setErrorMessage(
            ERROR_MESSAGES[error.message] ?? ERROR_MESSAGES.NO_ENGINE_RECORDS,
          );
        } else {
          setErrorMessage("云端数据加载失败，请稍后重试。");
        }
        setPhase("error");
      }
    };
    void run();
  };

  // 自动加载：默认挂载即拉取；startWhenVisible 时进入视口才拉一次
  // （首页嵌入模式，访客不滚到板块就不产生 3MB 数据请求）。
  useEffect(() => {
    const start = () => {
      reloadRef.current = loadFromCloud;
      loadFromCloud();
    };
    if (!startWhenVisible) {
      start();
      return;
    }
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") {
      start();
      return;
    }
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((entry) => entry.isIntersecting)) return;
        started = true;
        start();
        observer.disconnect();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(root);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectEngine = (engine: EngineRecord) => setSelectedId(engine.id);

  const focusEngine = (engine: EngineRecord) => {
    setSelectedId(engine.id);
    setQuery("");
    setFocusTarget({ lng: engine.lng, lat: engine.lat, key: Date.now() });
  };

  const totalText = dataset ? dataset.engines.length.toLocaleString("en-US") : "--";

  return (
    <div
      ref={rootRef}
      className={cn("ueg-engines-page", isEmbed && "ueg-engines-embed")}
    >
      {!isEmbed ? (
        <section className="head engine-head">
          <div className="engine-head-main">
            <div className="crumb">UEG / GLOBAL ENGINE NETWORK / BROWSER</div>
            <h1>
              发动机浏览器 <span>ENGINE BROWSER</span>
            </h1>
            <p className="intro">
              UEG 全球行星发动机网络监控 / 档案终端。数据由 R2 云端下发，
              仅在当前浏览器内存中解析，不落库。
            </p>
          </div>
          {dataset && phase === "ready" ? (
            <div className="engine-head-stats">
              <StatBlock label="ENGINES" value={totalText} />
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
      ) : null}

      {phase === "loading" ? (
        isEmbed ? (
          <section className="engine-loading is-embed" aria-live="polite">
            <div className="engine-radar" aria-hidden="true">
              <span className="engine-radar-ring" />
              <span className="engine-radar-ring" />
              <span className="engine-radar-ring" />
              <span className="engine-radar-sweep" />
              <span className="engine-radar-blip b1" />
              <span className="engine-radar-blip b2" />
              <span className="engine-radar-blip b3" />
              <span className="engine-radar-core" />
            </div>
            <p className="engine-loading-title">PLANETARY ENGINE NETWORK</p>
            <p className="engine-loading-step">
              <span className="engine-loading-prompt">&gt;</span> {parseStep}
              <span className="engine-loading-caret" aria-hidden="true" />
            </p>
            <div className="engine-loading-bar">
              <span />
            </div>
          </section>
        ) : (
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
        )
      ) : null}

      {phase === "error" ? (
        <section className="engine-error">
          <span className="engine-error-badge">{ERROR_TITLE}</span>
          <p className="engine-error-text">{errorMessage}</p>
          <button
            type="button"
            className="engine-primary-btn"
            onClick={() => reloadRef.current?.()}
          >
            重新加载云端数据
          </button>
        </section>
      ) : null}

      {phase === "ready" && dataset ? (
        <>
          <div className="engine-toolbar">
            <button
              type="button"
              className="engine-file-btn"
              onClick={() => reloadRef.current?.()}
            >
              重新加载 <span aria-hidden="true">⟳</span>
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
          </div>

          <div className="engine-layout" data-panel={selected ? "open" : "closed"}>
            <div className="engine-map">
              <EngineGlobe
                engines={filtered}
                datasetKey={String(datasetKey)}
                selected={selected}
                onSelect={selectEngine}
                focusTarget={focusTarget}
                modelUrl={modelUrl}
              />
            </div>
            {selected ? (
              <EnginePanel engine={selected} onClose={() => setSelectedId(null)} />
            ) : null}
          </div>

          {!isEmbed ? (
            <p className="engine-statusline">
              {dataset.engines.length.toLocaleString("en-US")} ENGINE NODES LOADED ·{" "}
              {filtered.length.toLocaleString("en-US")} VISIBLE · READY
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
