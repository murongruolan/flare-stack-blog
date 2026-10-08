import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getOrganization,
  ORGANIZATION_CATEGORIES,
  ORGANIZATION_LIST,
  organizationUnitAnchor,
} from "@/features/organization/data/organizations";
import { cn } from "@/lib/utils";

/** Ordered exactly as the approved reference lists them. */
const TYPE_ORDER = [
  "决策与治理",
  "行政执行",
  "军事与安全",
  "司法体系",
  "科研与工程",
  "航空航天",
  "专门委员会",
  "民生与人道",
];

const NETWORK_NODES = [
  { label: "NEW YORK · UEG总部", slug: "ueg-gov-001" },
  { label: "BEIJING · 数字生命研究体系", slug: "ueg-sci-014" },
  { label: "PARIS · UEG飞行控制中心", slug: "ueg-asa-001", hash: "scc" },
  { label: "GABON · 联合实验基地", slug: "ueg-asa-001", hash: "gabon" },
  { label: "MOON · UEG月球基地", slug: "ueg-asa-001", hash: "moon" },
];

const FACILITIES = [
  {
    code: "UEG-FAC-001",
    title: "UEG 月球基地",
    en: "LUNAR & SPACE SCIENCE INTERNATIONAL CENTER",
    desc: "负责月面科研、月球资源开发以及逐月计划相关工程任务。",
    slug: "ueg-asa-001",
    hash: "moon",
  },
  {
    code: "UEG-FAC-002",
    title: "加蓬联合实验基地",
    en: "GABON JOINT ENGINEERING BASE",
    desc: "太空电梯地面枢纽与行星发动机核心试验设施。",
    slug: "ueg-asa-001",
    hash: "gabon",
  },
  {
    code: "UEG-FAC-003",
    title: "UEG 飞行控制中心",
    en: "UEG SPACE FLIGHT CONTROL CENTER",
    desc: "负责逐月计划飞控、轨道演算以及全球航行状态监控。",
    slug: "ueg-asa-001",
    hash: "scc",
  },
  {
    code: "UEG-FAC-004",
    title: "领航员空间站",
    en: "NAVIGATOR SPACE STATION",
    desc: "UEG 重大空间任务与领航员计划的核心轨道设施。",
    slug: "ueg-asa-001",
    hash: "navigator",
  },
  {
    code: "UEG-FAC-005",
    title: "全球行星发动机控制网络",
    en: "PLANETARY ENGINE CONTROL NETWORK",
    desc: "分布于全球各地的行星发动机控制与维护设施网络。",
    slug: "ueg-asa-001",
    hash: "engines",
  },
  {
    code: "UEG-FAC-006",
    title: "全球地下城行政体系",
    en: "GLOBAL UNDERGROUND CITY ADMINISTRATION",
    desc: "由秘书处地下城事务体系协调的全球地下城市地方行政网络。",
    slug: "ueg-exe-001",
    hash: organizationUnitAnchor("地下城事务部"),
  },
];

/**
 * 架构图世代行（依据设定集）。每行铺在共享网格上：
 * 第二/三行三等分（常委会左、安理会正中、法院右），第四行四等分，
 * 秘书处与科学院同列——中线由 CSS 按百分比生成。
 */
type ChartNode = { slug: string; note?: string };

const CHART_ROWS: Array<Array<ChartNode>> = [
  [
    { slug: "ueg-gov-002" },
    { slug: "ueg-sec-001" },
    { slug: "ueg-jus-001" },
  ],
  [{ slug: "ueg-exe-001" }, { slug: "ueg-sec-002" }],
  [
    { slug: "ueg-sci-001" },
    { slug: "ueg-asa-001" },
    { slug: "ueg-com-001" },
    { slug: "ueg-sec-011" },
  ],
];

/** UEG-GOV-001 → GOV / 01 */
function shortCode(code: string): string {
  const match = code.match(/^UEG-([A-Z]+)-(\d+)$/);
  if (!match) return code;
  return `${match[1]} / ${Number(match[2]).toString().padStart(2, "0")}`;
}

function OrgNode({ slug, note }: ChartNode) {
  const org = getOrganization(slug);
  if (!org) return null;
  return (
    <Link
      className="tnode"
      to="/organization/$slug"
      params={{ slug: org.slug }}
    >
      <span className="tnode-code">{shortCode(org.code)}</span>
      <span className="tnode-title">{org.title}</span>
      {note ? <span className="tnode-note">{note}</span> : null}
      <span className="tnode-en">{org.en}</span>
    </Link>
  );
}

function OrganizationCard({ slug }: { slug: string }) {
  const org = getOrganization(slug);
  if (!org) return null;
  return (
    <article className="org-card">
      <div className="card-code">{org.code}</div>
      <h3>
        <Link to="/organization/$slug" params={{ slug }}>
          {org.title}
        </Link>
      </h3>
      <div className="en">{org.en}</div>
      <p>{org.summary}</p>
      <div className="card-meta">
        <span className="meta-tag accent">{org.nature}</span>
        <span className="meta-tag">{org.hq.split(" · ")[0]}</span>
      </div>
      <div className="card-bottom">
        <Link
          to="/organization/$slug"
          params={{ slug }}
          className="view"
        >
          查看机构 <b>→</b>
        </Link>
      </div>
    </article>
  );
}

/**
 * 机构介绍 — the organizational directory. The structure chart sits inline
 * above the card directory, as in the approved reference page; both read
 * from the authored organization archive.
 */
export function OrganizationPage() {
  const [type, setType] = useState<string | null>(null);
  const treeRef = useRef<HTMLDivElement | null>(null);

  // ≤820px the chart keeps its full desktop geometry and scrolls horizontally
  // (see ueg-org.css). Centre it so the root node — the chart's anchor — opens
  // on screen instead of the chart's left edge being cut off.
  //
  // Deliberately NOT bound to window resize: on mobile `resize` fires every time
  // the URL bar shows or hides, i.e. during ordinary vertical scrolling, and
  // re-centring there yanks the chart back mid-pan. Only a breakpoint crossing
  // (a layout mode change) re-centres. Above 820px scrollWidth === clientWidth,
  // so this is a no-op.
  useEffect(() => {
    const el = treeRef.current;
    if (!el) return;
    const center = () => {
      const overflow = el.scrollWidth - el.clientWidth;
      if (overflow > 1) el.scrollLeft = overflow / 2;
    };
    center();
    const mq = window.matchMedia("(max-width: 820px)");
    mq.addEventListener("change", center);
    return () => mq.removeEventListener("change", center);
  }, []);

  const types = useMemo(
    () => TYPE_ORDER.filter((name) => ORGANIZATION_CATEGORIES.includes(name)),
    [],
  );
  const visible = useMemo(
    () => (type ? ORGANIZATION_LIST.filter((o) => o.category === type) : ORGANIZATION_LIST),
    [type],
  );

  const executive = getOrganization("ueg-exe-001");
  const root = getOrganization("ueg-gov-001");

  return (
    <div className="ueg-org-page">
      <section className="section">
        <div className="section-head">
          <h2>UEG 政府组织结构</h2>
          <span className="en">GOVERNMENT STRUCTURE</span>
        </div>

        <div className="org-tree" ref={treeRef}>
          <div className="gen gen-1">
            <div className="cell">
              {root ? (
                <Link
                  className="tnode tnode-root"
                  to="/organization/$slug"
                  params={{ slug: root.slug }}
                >
                  <span className="tnode-code">{shortCode(root.code)}</span>
                  <span className="tnode-title">{root.title}</span>
                  <span className="tnode-en">{root.en}</span>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="gen gen-2">
            {CHART_ROWS[0].map((node) => (
              <div className="cell" key={node.slug}>
                <OrgNode {...node} />
              </div>
            ))}
          </div>

          <div className="gen gen-3">
            {CHART_ROWS[1].map((node) => (
              <div className="cell" key={node.slug}>
                <OrgNode {...node} />
              </div>
            ))}
            <div className="cell cell-empty" />
          </div>

          <div className="gen gen-4">
            {CHART_ROWS[2].map((node) => (
              <div className="cell" key={node.slug}>
                <OrgNode {...node} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="toolbar">
        <button
          type="button"
          className={cn("filter", !type && "active")}
          onClick={() => setType(null)}
        >
          全部
        </button>
        {types.map((name) => (
          <button
            key={name}
            type="button"
            className={cn("filter", type === name && "active")}
            onClick={() => setType(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <section className="directory">
        <div>
          <div className="cards">
            {visible.map((org) => (
              <OrganizationCard key={org.slug} slug={org.slug} />
            ))}
          </div>
        </div>

        <aside className="sidebar">
          <div className="side-title">
            <h2>机构导航</h2>
            <small>DIRECTORY INDEX</small>
          </div>

          <div className="side-block">
            <div className="side-kicker">EXECUTIVE BUREAUS</div>
            <div className="side-title2">司局直达</div>
            <div className="mini-list">
              {executive?.units.map((unit) => (
                <Link
                  key={unit.title}
                  to="/organization/$slug"
                  params={{ slug: "ueg-exe-001" }}
                  hash={organizationUnitAnchor(unit.title)}
                >
                  {unit.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="side-block">
            <div className="side-kicker">NETWORK</div>
            <div className="side-title2">主要节点</div>
            <div className="network-box">
              {NETWORK_NODES.map((node) => (
                <Link
                  key={node.label}
                  className="network-row"
                  to="/organization/$slug"
                  params={{ slug: node.slug }}
                  hash={node.hash}
                >
                  <span className="network-dot" />
                  {node.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="facility-section">
        <div className="section-head">
          <h2>一线执行设施</h2>
          <span className="en">OPERATIONAL FACILITIES</span>
        </div>
        <div className="facility-grid">
          {FACILITIES.map((facility) => (
            <Link
              key={facility.code}
              className="facility"
              to="/organization/$slug"
              params={{ slug: facility.slug }}
              hash={facility.hash}
            >
              <div className="code">{facility.code}</div>
              <h3>{facility.title}</h3>
              <div className="en">{facility.en}</div>
              <p>{facility.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
