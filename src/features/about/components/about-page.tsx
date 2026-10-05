import { Link } from "@tanstack/react-router";

type Milestone = {
  year: string;
  title: string;
  desc: string;
  code: string;
  current?: boolean;
};

const MILESTONES: Array<Milestone> = [
  {
    year: "2044",
    title: "联合地球政府成立",
    desc: "全球治理体系完成重大重组，UEG 正式建立。",
    code: "UEG-HIS-2044",
  },
  {
    year: "2052",
    title: "全球资源协调体系建立",
    desc: "战略能源、粮食及工业资源进入统一协调体系。",
    code: "UEG-HIS-2052",
  },
  {
    year: "2071",
    title: "行星工程计划启动",
    desc: "人类开始系统性研究行星级环境工程与能源方案。",
    code: "UEG-HIS-2071",
  },
  {
    year: "2078",
    title: "全球地下城计划启动",
    desc: "地下城市建设进入全球化阶段，公民长期生存保障体系正式建立。",
    code: "UEG-HIS-2078",
  },
  {
    year: "2086",
    title: "领航员计划成立",
    desc: "面向深空任务的人类导航、航天及空间站计划正式推进。",
    code: "UEG-HIS-2086",
  },
  {
    year: "2089",
    title: "当前纪元",
    desc: "人类社会进入新的文明阶段，UEG 持续推进全球治理与未来工程。",
    code: "UEG-HIS-NOW",
    current: true,
  },
];

const IDENTITY_CARDS = [
  {
    num: "01",
    title: "全球共同治理",
    desc: "协调成员政府与全球公共机构，处理影响整个人类社会的重大问题。",
  },
  {
    num: "02",
    title: "文明长期规划",
    desc: "以跨世代视角规划人口、能源、资源、基础设施与科学技术发展。",
  },
  {
    num: "03",
    title: "人类文明延续",
    desc: "无论地球环境如何变化，始终优先保证人类文明与知识体系能够延续。",
  },
];

const MISSIONS = [
  {
    num: "MISSION / 01",
    index: "01",
    title: "人类生存",
    en: "HUMAN SURVIVAL",
    desc: "维护全球居民基本生存条件、生命安全与公共基础设施，应对可能威胁人类社会存续的重大风险。",
  },
  {
    num: "MISSION / 02",
    index: "02",
    title: "文明延续",
    en: "CIVILIZATION",
    desc: "保存科学、文化、教育与技术知识，确保人类文明能够跨越重大历史断裂继续发展。",
  },
  {
    num: "MISSION / 03",
    index: "03",
    title: "地球治理",
    en: "EARTH GOVERNANCE",
    desc: "协调全球资源、生态环境、基础设施与公共政策，建立长期稳定的共同治理体系。",
  },
  {
    num: "MISSION / 04",
    index: "04",
    title: "未来探索",
    en: "FUTURE EXPLORATION",
    desc: "推动航天工程、空间站、深空探索与未来科技研究，为人类文明寻找新的发展空间。",
  },
];

/**
 * 关于我们 — the public archive's identity page. Its copy is editorial
 * (founding narrative, milestones, charter), so it is authored here rather
 * than read from the database; the archive links point at real sections.
 */
export function AboutPage() {
  return (
    <div className="ueg-about-page">
      <section className="page-head">
        <div className="page-head-content">
          <div className="crumb">UEG / PUBLIC ARCHIVE / ABOUT</div>
          <h1>
            关于我们 <span>UNITED EARTH GOVERNMENT</span>
          </h1>
          <div className="page-lead">
            联合地球政府，是人类在全球性危机与文明存续挑战下建立的共同治理机构。其核心职责，是协调全球资源、维护人类社会基本秩序，并推动人类文明持续向未来发展。
          </div>
          <div className="page-caption">
            PUBLIC ARCHIVE · UEG-HISTORY · CURRENT ERA 2089
          </div>
        </div>
      </section>

      <section className="glance">
        <div className="glance-intro">
          <div className="kicker">UEG AT A GLANCE</div>
          <div className="glance-title">一个文明，一个共同体，一个未来。</div>
          <div className="glance-copy">
            UEG 不属于任何单一国家，而是以人类整体生存与文明延续为目标建立的全球治理体系。
          </div>
        </div>

        <div className="glance-stat">
          <div className="kicker">ESTABLISHED</div>
          <div className="stat-value">2044</div>
          <div className="stat-name">联合地球政府成立</div>
          <div className="stat-sub">UEG-FOUNDATION</div>
        </div>

        <div className="glance-stat">
          <div className="kicker">GOVERNANCE</div>
          <div className="stat-value">GLOBAL</div>
          <div className="stat-name">全球协同治理</div>
          <div className="stat-sub">HUMAN CIVILIZATION</div>
        </div>

        <div className="glance-stat">
          <div className="kicker">CURRENT ERA</div>
          <div className="stat-value">2089</div>
          <div className="stat-name">当前纪元</div>
          <div className="stat-sub">EARTH YEAR 2089</div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>我们是谁</h2>
          <span className="en">WHO WE ARE</span>
        </div>

        <div className="identity-grid">
          <article className="identity-main">
            <div className="kicker">UNITED EARTH GOVERNMENT</div>
            <h3>
              我们共同守护的，是<span>人类文明本身。</span>
            </h3>
            <p>
              当人类社会所面对的问题已经跨越国界，当能源、环境、人口与生存空间成为所有人的共同挑战，传统的国家间协调机制已经无法独立承担文明延续所需要的责任。
            </p>
            <p>
              联合地球政府因此承担起全球协调与长期规划职责，通过统一的公共政策、资源调度体系、航天计划及地下城治理体系，为人类社会建立一套可以跨越世代运行的共同秩序。
            </p>
            <div className="identity-statement">
              “我们的目标从来不只是让今天的人类活下去。我们必须让未来的人类仍然拥有选择未来的权利。”
            </div>
          </article>

          <div className="identity-side">
            {IDENTITY_CARDS.map((card) => (
              <article key={card.num} className="identity-card">
                <div className="num">{card.num}</div>
                <h4>{card.title}</h4>
                <p>{card.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>UEG 发展历程</h2>
          <span className="en">HISTORICAL ARCHIVE</span>
        </div>

        <div className="timeline-wrap">
          <div className="timeline">
            <div className="timeline-line" />
            {MILESTONES.map((item) => (
              <div
                key={item.year}
                className={item.current ? "timeline-item current" : "timeline-item"}
              >
                <div className="timeline-dot" />
                <div className="timeline-year">{item.year}</div>
                <div className="timeline-title">{item.title}</div>
                <div className="timeline-desc">{item.desc}</div>
                <div className="timeline-code">{item.code}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>核心使命</h2>
          <span className="en">CORE MISSION</span>
        </div>

        <div className="mission-grid">
          {MISSIONS.map((mission) => (
            <article key={mission.num} className="mission-card">
              <div className="mission-num">{mission.num}</div>
              <div className="mission-icon">{mission.index}</div>
              <h3>{mission.title}</h3>
              <div className="mission-en">{mission.en}</div>
              <p>{mission.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="charter">
        <div className="charter-top">
          <div className="charter-label">UEG FOUNDING PRINCIPLE</div>
          <div className="charter-id">ARCHIVE / CHARTER / 0001</div>
        </div>
        <h2>
          我们并不代表某一个国家。<span>我们代表人类共同的未来。</span>
        </h2>
        <p>
          联合地球政府的存在，不是为了取代人类社会中的一切差异，而是在面对共同生存挑战时，建立一个所有人都能够共同参与、共同承担责任并共同继承的治理体系。
        </p>
        <div className="charter-line" />
        <div className="charter-footer">
          <span>UNITED EARTH GOVERNMENT</span>
          <span>PUBLIC RECORD · ACCESS LEVEL 01</span>
          <span>EARTH YEAR 2089</span>
        </div>
      </section>

      <section className="archive-grid">
        <Link className="archive-card" to="/posts">
          <div>
            <div className="archive-kicker">ORGANIZATION</div>
            <div className="archive-title">UEG 组织体系</div>
            <div className="archive-desc">
              查看联合地球政府主要机构、管理部门及组织架构。
            </div>
          </div>
          <div className="archive-arrow">→</div>
        </Link>

        <Link className="archive-card" to="/policy">
          <div>
            <div className="archive-kicker">POLICY ARCHIVE</div>
            <div className="archive-title">政策法规档案库</div>
            <div className="archive-desc">
              查询联合地球政府公开法律、法规及长期发展政策。
            </div>
          </div>
          <div className="archive-arrow">→</div>
        </Link>
      </section>
    </div>
  );
}
