import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  getOrganization,
  ORGANIZATION_LIST,
  organizationUnitAnchor,
  type Organization,
} from "@/features/organization/data/organizations";
import { cn } from "@/lib/utils";

/**
 * 机构介绍 V2（对比版）——按外部锐评重排：
 * - 16px 网格；主体卡片两列定高，简介 3 行截断，「查看机构」固定底部同线
 * - 层级排序（大会 → 常务委 → 安理会 → 秘书处 → 军委会 → 最高法院 → 科研航天
 *   → 专门委员会 → 民生），一线设施不再换 3 列，保持两列同构卡
 * - 层级边框：顶层浅蓝 / 下属灰 / 一线设施弱青；卡片 hover 冷光
 * - 拓扑图：连线加粗、顶层盒加定位注解、等宽盒
 * - 侧栏机构导航分组折叠（默认展开第一组）
 * - 「查看机构」改为页内模态档案（不跳转），模态内保留完整档案页入口
 * 对比结论出来后保留赢家、删除输家即可。
 */

/** 层级排序：自由排布 → 按组织层级从高到低。 */
const HIERARCHY_ORDER = [
  "ueg-gov-001",
  "ueg-gov-002",
  "ueg-sec-001",
  "ueg-exe-001",
  "ueg-sec-002",
  "ueg-jus-001",
  "ueg-sci-001",
  "ueg-asa-001",
  "ueg-sci-014",
  "ueg-com-001",
  "ueg-com-002",
  "ueg-sec-011",
  "ueg-hum-001",
  "ueg-hum-002",
];

/** 顶层决策 / 执行 / 司法主机构（浅蓝边框 + 定位注解）。 */
const TOP_TIER = new Set([
  "ueg-gov-001",
  "ueg-gov-002",
  "ueg-sec-001",
  "ueg-exe-001",
  "ueg-sec-002",
  "ueg-jus-001",
]);

const ROLE_NOTES: Record<string, string> = {
  "ueg-gov-001": "最高权力机关",
  "ueg-gov-002": "闭会期间常设决策机构",
  "ueg-sec-001": "安全与危机决策机构",
  "ueg-exe-001": "最高行政执行机构",
  "ueg-sec-002": "全球军事统帅机构",
  "ueg-jus-001": "最高司法机关",
};

const STRUCTURE_BRANCHES = [
  { slug: "ueg-gov-002", code: "GOV / 02" },
  { slug: "ueg-sec-001", code: "SEC / 01" },
  { slug: "ueg-exe-001", code: "EXEC / 01" },
];

const STRUCTURE_CHIPS = [
  { slug: "ueg-jus-001", key: "JUDICIARY", note: "最高司法机关" },
  { slug: "ueg-sci-001", key: "SCIENCE", note: "全球科研总管" },
  { slug: "ueg-asa-001", key: "AEROSPACE", note: "航天与空间项目主管机构" },
  { slug: "ueg-sec-002", key: "SECURITY", note: "全球安全军统帅机构" },
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

/** 侧栏分组（锐评五组；一线设施为页内锚点）。 */
const NAV_GROUPS: Array<{
  key: string;
  label: string;
  en: string;
  slugs?: Array<string>;
  anchor?: string;
}> = [
  {
    key: "top",
    label: "顶层决策机关",
    en: "CENTRAL AUTHORITY",
    slugs: [
      "ueg-gov-001",
      "ueg-gov-002",
      "ueg-sec-001",
      "ueg-exe-001",
      "ueg-sec-002",
      "ueg-jus-001",
    ],
  },
  {
    key: "sci",
    label: "科研航天",
    en: "SCIENCE & AEROSPACE",
    slugs: ["ueg-sci-001", "ueg-asa-001", "ueg-sci-014"],
  },
  {
    key: "com",
    label: "专门委员会",
    en: "COMMITTEES",
    slugs: ["ueg-com-001", "ueg-com-002", "ueg-sec-011"],
  },
  {
    key: "hum",
    label: "民生与人道",
    en: "HUMANITARIAN",
    slugs: ["ueg-hum-001", "ueg-hum-002"],
  },
  { key: "fac", label: "一线执行设施", en: "FACILITIES", anchor: "#v2-facilities" },
];

function sortInHierarchy(orgs: Array<Organization>) {
  return [...orgs].sort(
    (a, b) =>
      HIERARCHY_ORDER.indexOf(a.slug) - HIERARCHY_ORDER.indexOf(b.slug),
  );
}

/* ---------- 机构档案模态（页内查阅，不跳转） ---------- */

function OrgArchiveModal({
  org,
  onClose,
}: {
  org: Organization;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="v2-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="v2-modal"
        role="dialog"
        aria-modal="true"
        aria-label={org.title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="v2-modal-top">
          <span className="v2-modal-kicker">ARCHIVE / {org.code}</span>
          <button
            type="button"
            className="v2-modal-close"
            onClick={onClose}
            aria-label="关闭档案"
          >
            ×
          </button>
        </div>
        <h2 className="v2-modal-title">{org.title}</h2>
        <p className="v2-modal-en">{org.en}</p>
        <div className="v2-modal-rows">
          <div className="v2-row">
            <span className="v2-row-label">机构定位</span>
            <span className="v2-row-value">{org.nature}</span>
          </div>
          <div className="v2-row">
            <span className="v2-row-label">类别</span>
            <span className="v2-row-value">{org.category}</span>
          </div>
          <div className="v2-row">
            <span className="v2-row-label">驻地</span>
            <span className="v2-row-value">{org.hq}</span>
          </div>
        </div>
        <p className="v2-modal-summary">{org.summary}</p>
        {org.duties.length > 0 ? (
          <div className="v2-modal-block">
            <div className="v2-block-kicker">主要职能 / MANDATE</div>
            <ol className="v2-duty-list">
              {org.duties.map((duty, index) => (
                <li key={duty}>
                  <span className="v2-duty-no">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {duty}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {org.units.length > 0 ? (
          <div className="v2-modal-block">
            <div className="v2-block-kicker">下设体系 / SUBORDINATES</div>
            <div className="v2-unit-grid">
              {org.units.map((unit) => (
                <div key={unit.title} className="v2-unit">
                  <div className="v2-unit-title">{unit.title}</div>
                  <div className="v2-unit-desc">{unit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <Link
          to="/organization/$slug"
          params={{ slug: org.slug }}
          className="v2-modal-cta"
          onClick={onClose}
        >
          打开完整档案页 <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

/* ---------- 机构卡（定高、查看机构弹模态） ---------- */

function OrgCardV2({
  org,
  onOpen,
}: {
  org: Organization;
  onOpen: (org: Organization) => void;
}) {
  const top = TOP_TIER.has(org.slug);
  return (
    <article className={cn("v2-org-card", top && "tier-top")}>
      <div className="v2-card-code">{org.code}</div>
      <h3 className="v2-card-title">
        <span title={org.title}>{org.title}</span>
      </h3>
      <div className="v2-card-en" title={org.en}>
        {org.en}
      </div>
      <p className="v2-card-summary" title={org.summary}>
        {org.summary}
      </p>
      <div className="v2-card-meta">
        <span className="v2-card-nature">{org.nature}</span>
        <span className="v2-card-hq">{org.hq.split(" · ")[0]}</span>
      </div>
      <div className="v2-card-bottom">
        <span className="v2-card-public">公开档案</span>
        <button
          type="button"
          className="v2-card-view"
          onClick={() => onOpen(org)}
        >
          查看机构 <b aria-hidden="true">→</b>
        </button>
      </div>
    </article>
  );
}

/* ---------- 页面 ---------- */

export function OrganizationPageV2() {
  const [type, setType] = useState<string | null>(null);
  const [modalOrg, setModalOrg] = useState<Organization | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>("top");

  const types = useMemo(
    () => TYPE_ORDER.filter((name) => ORGANIZATION_LIST.some((o) => o.category === name)),
    [],
  );

  const ordered = useMemo(() => sortInHierarchy(ORGANIZATION_LIST), []);
  const visible = useMemo(
    () => (type ? ordered.filter((o) => o.category === type) : ordered),
    [ordered, type],
  );

  const executive = getOrganization("ueg-exe-001");

  return (
    <div className="ueg-orgv2-page">
      <section className="page-head">
        <div className="page-head-content">
          <div className="crumb">
            UEG / PUBLIC ARCHIVE / ORGANIZATIONAL DIRECTORY
          </div>
          <h1>
            机构介绍 <span>ORGANIZATIONAL DIRECTORY</span>
          </h1>
          <p>
            联合地球政府主要机关、直属机构、专门委员会与全球执行设施公开档案。探索
            UEG 的治理体系、行政网络与人类未来工程体系。
          </p>
        </div>
      </section>

      <section className="v2-section">
        <div className="v2-section-head">
          <h2>UEG 政府组织结构</h2>
          <span className="v2-section-en">GOVERNMENT STRUCTURE</span>
        </div>

        <div className="v2-structure">
          <div className="v2-org-root">
            <div className="v2-org-node">
              <div className="v2-org-note">最高权力机关</div>
              <div className="v2-org-code">UEG / CENTRAL AUTHORITY</div>
              <h3>{getOrganization("ueg-gov-001")?.title}</h3>
              <div className="v2-org-sub">
                {getOrganization("ueg-gov-001")?.en}
              </div>
            </div>
          </div>

          <div className="v2-org-stem" />

          <div className="v2-org-branches">
            {STRUCTURE_BRANCHES.map((branch) => {
              const org = getOrganization(branch.slug);
              if (!org) return null;
              return (
                <div key={branch.slug} className="v2-branch">
                  <div className="v2-org-node">
                    <div className="v2-org-note">{ROLE_NOTES[branch.slug]}</div>
                    <div className="v2-org-code">{branch.code}</div>
                    <h3>{org.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="v2-subsystems">
            {STRUCTURE_CHIPS.map((chip) => {
              const org = getOrganization(chip.slug);
              if (!org) return null;
              return (
                <button
                  key={chip.slug}
                  type="button"
                  className="v2-system-chip"
                  onClick={() => setModalOrg(org)}
                >
                  <span className="v2-chip-k">{chip.key}</span>
                  <span className="v2-chip-t">{org.title}</span>
                  <span className="v2-chip-s">{chip.note}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="v2-toolbar">
        <span className="v2-toolbar-label">ORGANIZATION TYPE</span>
        <button
          type="button"
          className={cn("v2-filter", !type && "active")}
          onClick={() => setType(null)}
        >
          全部
        </button>
        {types.map((name) => (
          <button
            key={name}
            type="button"
            className={cn("v2-filter", type === name && "active")}
            onClick={() => setType(name)}
          >
            {name}
          </button>
        ))}
        <span className="v2-toolbar-spacer" />
        <span className="v2-toolbar-result">
          DIRECTORY · {visible.length} INSTITUTIONS · 2089
        </span>
      </div>

      <section className="v2-directory">
        <div className="v2-cards">
          {visible.map((org) => (
            <OrgCardV2 key={org.slug} org={org} onOpen={setModalOrg} />
          ))}
        </div>

        <aside className="v2-side">
          <div className="v2-side-head">
            <h2>机构导航</h2>
            <small>DIRECTORY INDEX</small>
          </div>
          {NAV_GROUPS.map((group) => {
            const open = openGroup === group.key;
            return (
              <div key={group.key} className="v2-nav-group" data-open={open}>
                <button
                  type="button"
                  className="v2-nav-group-head"
                  onClick={() => setOpenGroup(open ? null : group.key)}
                >
                  <span className="v2-nav-chevron" aria-hidden="true">
                    {open ? "▾" : "▸"}
                  </span>
                  <span className="v2-nav-label">{group.label}</span>
                  <span className="v2-nav-count">
                    {group.slugs ? group.slugs.length : "06"}
                  </span>
                </button>
                {open ? (
                  <div className="v2-nav-body">
                    <div className="v2-nav-en">{group.en}</div>
                    {group.slugs
                      ? group.slugs.map((slug) => (
                          <Link
                            key={slug}
                            to="/organization/$slug"
                            params={{ slug }}
                            className="v2-nav-item"
                          >
                            {getOrganization(slug)?.title}
                          </Link>
                        ))
                      : null}
                    {group.anchor ? (
                      <a className="v2-nav-item" href={group.anchor}>
                        查看一线设施档案 ↓
                      </a>
                    ) : null}
                    {group.key === "top" && executive ? (
                      <div className="v2-nav-sub">
                        {executive.units.map((unit) => (
                          <Link
                            key={unit.title}
                            to="/organization/$slug"
                            params={{ slug: "ueg-exe-001" }}
                            hash={organizationUnitAnchor(unit.title)}
                            className="v2-nav-item v2-nav-item-sub"
                          >
                            ↳ {unit.title}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="v2-side-block">
            <div className="v2-side-kicker">NETWORK</div>
            <div className="v2-side-title2">主要节点</div>
            <div className="v2-network">
              {NETWORK_NODES.map((node) => (
                <Link
                  key={node.label}
                  className="v2-network-row"
                  to="/organization/$slug"
                  params={{ slug: node.slug }}
                  hash={node.hash}
                >
                  <span className="v2-network-dot" />
                  {node.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="v2-facility-section" id="v2-facilities">
        <div className="v2-section-head">
          <h2>一线执行设施</h2>
          <span className="v2-section-en">OPERATIONAL FACILITIES</span>
        </div>
        <div className="v2-cards v2-facility-grid">
          {FACILITIES.map((facility) => (
            <Link
              key={facility.code}
              className="v2-org-card v2-facility-card"
              to="/organization/$slug"
              params={{ slug: facility.slug }}
              hash={facility.hash}
            >
              <div className="v2-card-code">{facility.code}</div>
              <h3 className="v2-card-title">
                <span title={facility.title}>{facility.title}</span>
              </h3>
              <div className="v2-card-en" title={facility.en}>
                {facility.en}
              </div>
              <p className="v2-card-summary" title={facility.desc}>
                {facility.desc}
              </p>
              <div className="v2-card-bottom">
                <span className="v2-card-public">公开档案</span>
                <span className="v2-card-view">
                  查看设施 <b aria-hidden="true">→</b>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {modalOrg ? (
        <OrgArchiveModal org={modalOrg} onClose={() => setModalOrg(null)} />
      ) : null}
    </div>
  );
}
