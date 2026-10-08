import { Link } from "@tanstack/react-router";
import {
  getOrganization,
  organizationUnitAnchor,
} from "@/features/organization/data/organizations";

function pad(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * 机构详情 — one institution's public archive: profile facts, mandates, the
 * archive description, subordinate units and (where they exist) facilities.
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

  // Only institutions that carry authored facility records get the section.
  // The old fallback reused `units`, which duplicated 下属 / 关联体系 on 13 of
  // the 14 pages with an uppercased copy of the same names.
  const facilities = org.facilities ?? [];

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

      <div className="doc">
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
          </div>
        </section>

        <section className="panel" id="responsibility">
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

        <section className="panel" id="overview">
          <h2>机构概况</h2>
          <div className="subline">INSTITUTIONAL OVERVIEW</div>
          <div className="summary">
            {org.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="panel" id="structure">
          <h2>下属 / 关联体系</h2>
          <div className="subline">SUBORDINATE &amp; RELATED UNITS</div>
          <div className="units">
            {org.units.map((unit) => {
              // Kept as an anchor: the directory page's 司局直达 list deep-links
              // to these ids.
              const anchor = organizationUnitAnchor(unit.title);
              return (
                <div key={unit.title} className="unit" id={anchor}>
                  <div className="t">{unit.title}</div>
                  <div className="d">{unit.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        {facilities.length > 0 ? (
          <section className="panel" id="facilities">
            <h2>相关设施</h2>
            <div className="subline">OPERATIONAL FACILITIES</div>
            <div className="facilities">
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
    </div>
  );
}
