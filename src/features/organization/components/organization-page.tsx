import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

// ==================== 组织架构树（依据设定集） ====================

type TreeNode = {
  slug: string;
  note?: string;
  children?: TreeNode[];
};

/** 会同设定集确定的世代：大会 → 三线 → 执行/司法 → 四机构。 */
const STRUCTURE_TREE: TreeNode[] = [
  {
    slug: "ueg-gov-002",
    note: "常设行政决策",
    children: [
      {
        slug: "ueg-exe-001",
        note: "最高行政执行",
        children: [
          { slug: "ueg-sci-001" },
          { slug: "ueg-asa-001" },
          { slug: "ueg-com-001" },
          { slug: "ueg-sec-011" },
        ],
      },
    ],
  },
  {
    slug: "ueg-sec-001",
    note: "安全军事决策",
    children: [{ slug: "ueg-sec-002" }],
  },
  {
    slug: "ueg-jus-001",
    note: "司法独立",
  },
];

/** UEG-GOV-001 → GOV / 01 */
function shortCode(code: string): string {
  const match = code.match(/^UEG-([A-Z]+)-(\d+)$/);
  if (!match) return code;
  return `${match[1]} / ${Number(match[2]).toString().padStart(2, "0")}`;
}

function TreeNodeView({ node }: { node: TreeNode }) {
  const org = getOrganization(node.slug);
  if (!org) return null;
  return (
    <div className="torg">
      <Link
        className="tnode"
        to="/organization/$slug"
        params={{ slug: org.slug }}
      >
        <span className="tnode-code">{shortCode(org.code)}</span>
        <span className="tnode-title">{org.title}</span>
        {node.note ? <span className="tnode-note">{node.note}</span> : null}
        <span className="tnode-en">{org.en}</span>
      </Link>
      {node.children?.length ? (
        <div className="children">
          {node.children.map((item) => (
            <TreeNodeView key={item.slug} node={item} />
          ))}
        </div>
      ) : null}
    </div>
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
 * 机构介绍 — the organizational directory. A tab bar switches between the
 * card directory (default) and the full structure tree; both read from the
 * authored organization archive.
 */
export function OrganizationPage() {
  const [tab, setTab] = useState<"directory" | "structure">("directory");
  const [type, setType] = useState<string | null>(null);

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
      <section className="page-head">
        <div className="page-head-content">
          <div className="crumb">UEG / PUBLIC ARCHIVE / ORGANIZATIONAL DIRECTORY</div>
          <h1>
            机构介绍 <span>ORGANIZATIONAL DIRECTORY</span>
          </h1>
          <p>
            联合地球政府主要机关、直属机构、专门委员会与全球执行设施公开档案。探索 UEG 的治理体系、行政网络与人类未来工程体系。
          </p>
        </div>
      </section>

      <div className="org-tabs" role="tablist" aria-label="机构内容切换">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "directory"}
          className={cn("org-tab", tab === "directory" && "active")}
          onClick={() => setTab("directory")}
        >
          机构目录 <span>DIRECTORY</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "structure"}
          className={cn("org-tab", tab === "structure" && "active")}
          onClick={() => setTab("structure")}
        >
          政府组织结构 <span>GOVERNMENT STRUCTURE</span>
        </button>
      </div>

      {tab === "structure" ? (
        <section className="section">
          <div className="org-tree">
            {root ? (
              <div className="torg">
                <Link
                  className="tnode tnode-root"
                  to="/organization/$slug"
                  params={{ slug: root.slug }}
                >
                  <span className="tnode-code">{shortCode(root.code)}</span>
                  <span className="tnode-title">{root.title}</span>
                  <span className="tnode-en">{root.en}</span>
                </Link>
                <div className="children">
                  {STRUCTURE_TREE.map((node) => (
                    <TreeNodeView key={node.slug} node={node} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
            ) : (
        <>
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
        </>
      )}

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
