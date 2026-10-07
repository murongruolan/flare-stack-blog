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

const STRUCTURE_BRANCHES = [
  {
    slug: "ueg-gov-002",
    code: "GOV / 02",
    subs: [] as Array<{ slug: string; label: string }>,
  },
  {
    slug: "ueg-sec-001",
    code: "SEC / 01",
    subs: [{ slug: "ueg-sec-002", label: "地球军事委员会" }],
  },
  { slug: "ueg-exe-001", code: "EXE / 01", subs: [] },
];

/** 与大会三条线并列的独立机关；note 取档案的机构性质。 */
const STRUCTURE_INDEPENDENTS = [
  { slug: "ueg-jus-001", key: "JUDICIARY" },
  { slug: "ueg-sci-001", key: "SCIENCE" },
  { slug: "ueg-sci-014", key: "DIGITAL LIFE" },
  { slug: "ueg-asa-001", key: "AEROSPACE" },
  { slug: "ueg-com-001", key: "ETHICS" },
  { slug: "ueg-com-002", key: "NAVIGATION" },
  { slug: "ueg-sec-011", key: "ECOSOC" },
  { slug: "ueg-hum-001", key: "REFUGEES" },
  { slug: "ueg-hum-002", key: "FOOD PROGRAMME" },
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
 * 机构介绍 — the organizational directory. Structure, cards, facilities and
 * sidebar all read from the authored organization archive.
 */
export function OrganizationPage() {
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

      <section className="section">
        <div className="section-head">
          <h2>UEG 政府组织结构</h2>
          <span className="en">GOVERNMENT STRUCTURE</span>
        </div>

        <div className="structure">
          <div className="org-root">
            <div className="org-node">
              <div className="code">GOV / 01</div>
              <h3>{getOrganization("ueg-gov-001")?.title}</h3>
              <div className="sub">{getOrganization("ueg-gov-001")?.en}</div>
            </div>
          </div>

          <div className="org-stem" />

          <div className="org-branches">
            {STRUCTURE_BRANCHES.map((branch) => {
              const org = getOrganization(branch.slug);
              if (!org) return null;
              return (
                <div key={branch.slug} className="branch">
                  <div className="org-node">
                    <div className="code">{branch.code}</div>
                    <h3>{org.title}</h3>
                    <div className="sub">{org.en}</div>
                    {branch.subs.map((sub) => (
                      <Link
                        key={sub.slug}
                        className="branch-sub"
                        to="/organization/$slug"
                        params={{ slug: sub.slug }}
                      >
                        └ {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sub-divider">INDEPENDENT &amp; SPECIALIZED BODIES</div>
          <div className="subsystems">
            {STRUCTURE_INDEPENDENTS.map((chip) => {
              const org = getOrganization(chip.slug);
              if (!org) return null;
              return (
                <Link
                  key={chip.slug}
                  className="system-chip"
                  to="/organization/$slug"
                  params={{ slug: chip.slug }}
                >
                  <div className="k">{chip.key}</div>
                  <div className="t">{org.title}</div>
                  <div className="s">{org.nature}</div>
                </Link>
              );
            })}
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
