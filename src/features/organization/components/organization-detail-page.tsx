import { Link } from "@tanstack/react-router";
import {
  getOrganization,
  organizationUnitAnchor,
} from "@/features/organization/data/organizations";
import { cn } from "@/lib/utils";

const DIRECTORY_CONTEXT = [
  {
    key: "GOVERNANCE",
    slug: "ueg-gov-001",
    note: "UEG最高权力机关",
  },
  {
    key: "EXECUTIVE",
    slug: "ueg-exe-001",
    note: "UEG最高行政执行机构",
  },
  {
    key: "AEROSPACE",
    slug: "ueg-asa-001",
    note: "航天与空间项目主管机构",
  },
];

const FACILITY_ACCESS = [
  { key: "MOON", title: "UEG 月球基地", slug: "ueg-asa-001", hash: "moon" },
  {
    key: "GABON",
    title: "加蓬联合实验基地",
    slug: "ueg-asa-001",
    hash: "gabon",
  },
  { key: "PARIS", title: "UEG 飞行控制中心", slug: "ueg-asa-001", hash: "scc" },
  { key: "ORBIT", title: "领航员空间站", slug: "ueg-asa-001", hash: "navigator" },
];

function pad(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * 机构详情 — one institution's public archive: profile facts, mandates,
 * subordinate units, milestones and related facilities.
 */
export function OrganizationDetailPage({ slug }: { slug: string }) {
  const org = getOrganization(slug);

  if (!org) {
    return (
      <div className="ueg-org-detail-page">
        <div className="hero">
          <div className="hero-content">
            <Link className="back" to="/organization">
              ← 返回机构目录
            </Link>
            <div className="crumb">UEG / ORGANIZATION</div>
            <h1>未找到该机构</h1>
            <p>该机构档案不存在或尚未公开，请返回机构目录重新选择。</p>
          </div>
        </div>
      </div>
    );
  }

  const facilities =
    org.facilities ??
    org.units.map((unit, index) => ({
      anchor: `u${index}`,
      title: unit.title,
      en: unit.title.toUpperCase(),
      desc: unit.desc,
    }));

  return (
    <div className="ueg-org-detail-page">
      <div className="hero">
        <div className="hero-content">
          <Link className="back" to="/organization">
            ← 返回机构目录
          </Link>
          <div className="crumb">
            UEG / ORGANIZATION / {org.category.toUpperCase()}
          </div>
          <div className="code">{org.code}</div>
          <h1>{org.title}</h1>
          <div className="en">{org.en}</div>
          <p>{org.summary}</p>
          <div className="hero-actions">
            <a className="btn accent" href="#responsibility">
              主要职责 <b>↓</b>
            </a>
            <a className="btn" href="#structure">
              下属 / 关联机构 <b>↓</b>
            </a>
          </div>
        </div>
      </div>

      <div className="grid">
        <div>
          <section className="panel">
            <h2>机构档案</h2>
            <div className="subline">INSTITUTIONAL PROFILE</div>
            <div className="facts">
              <div className="fact">
                <div className="k">DOCUMENT ID</div>
                <div className="v">{org.code}</div>
              </div>
              <div className="fact">
                <div className="k">机构性质</div>
                <div className="v">{org.nature}</div>
              </div>
              <div className="fact">
                <div className="k">主管体系</div>
                <div className="v">{org.category}</div>
              </div>
              <div className="fact">
                <div className="k">总部 / 所在地</div>
                <div className="v">{org.hq}</div>
              </div>
            </div>
          </section>

          <section className="panel" id="responsibility" style={{ marginTop: 18 }}>
            <h2>主要职责</h2>
            <div className="subline">CORE RESPONSIBILITIES</div>
            <div className="detail-list">
              {org.duties.map((duty, index) => (
                <div key={duty} className="detail-item">
                  <div className="k">FUNCTION / {pad(index)}</div>
                  <div className="t">{duty}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel" id="structure" style={{ marginTop: 18 }}>
            <h2>下属 / 关联体系</h2>
            <div className="subline">SUBORDINATE &amp; RELATED UNITS</div>
            <div className="side-list">
              {org.units.map((unit, index) => {
                const anchor = organizationUnitAnchor(unit.title);
                return (
                  <a
                    key={unit.title}
                    className="side-item"
                    id={anchor}
                    href={`#${anchor}`}
                  >
                    <div className="k">UNIT / {pad(index)}</div>
                    <div className="t">{unit.title}</div>
                    <div className="d">{unit.desc}</div>
                  </a>
                );
              })}
            </div>
          </section>

          <section className="panel" style={{ marginTop: 18 }}>
            <h2>运行 / 历史记录</h2>
            <div className="subline">ARCHIVE TIMELINE</div>
            <div className="timeline">
              {org.history.map((entry, index) => (
                <div
                  key={`${entry.year}-${entry.title}`}
                  className={cn(
                    "titem",
                    index === org.history.length - 1 && "current",
                  )}
                >
                  <div className="y">{entry.year}</div>
                  <h3>{entry.title}</h3>
                  <p>{entry.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {facilities.length > 0 ? (
            <section className="panel" style={{ marginTop: 18 }}>
              <h2>相关设施</h2>
              <div className="subline">OPERATIONAL FACILITIES</div>
              <div className="facility-grid">
                {facilities.map((facility, index) => (
                  <article
                    key={facility.anchor}
                    className="facility"
                    id={facility.anchor}
                  >
                    <div className="k">FACILITY / {pad(index)}</div>
                    <h3>{facility.title}</h3>
                    <div className="en">{facility.en}</div>
                    <p>{facility.desc}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside>
          <section className="panel">
            <h2>机构档案索引</h2>
            <div className="subline">DIRECTORY CONTEXT</div>
            <div className="side-list">
              {DIRECTORY_CONTEXT.map((entry) => (
                <Link
                  key={entry.slug}
                  className="side-item"
                  to="/organization/$slug"
                  params={{ slug: entry.slug }}
                >
                  <div className="k">{entry.key}</div>
                  <div className="t">{getOrganization(entry.slug)?.title}</div>
                  <div className="d">{entry.note}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel" style={{ marginTop: 18 }}>
            <h2>关联设施快速访问</h2>
            <div className="subline">FACILITY ACCESS</div>
            <div className="side-list">
              {FACILITY_ACCESS.map((entry) => (
                <Link
                  key={entry.key}
                  className="side-item"
                  to="/organization/$slug"
                  params={{ slug: entry.slug }}
                  hash={entry.hash}
                >
                  <div className="k">{entry.key}</div>
                  <div className="t">{entry.title}</div>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
