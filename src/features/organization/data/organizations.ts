/**
 * Organizational directory content.
 *
 * The UEG directory is editorial archive material (structure, mandates,
 * facilities, milestones) and has no database table, so it is authored here as
 * typed data. Generated from the approved reference to keep the copy exact.
 */

export type OrganizationUnit = {
  title: string;
  desc: string;
};

export type OrganizationFacility = {
  anchor: string;
  title: string;
  en: string;
  desc: string;
};

export type OrganizationMilestone = {
  year: string;
  title: string;
  desc: string;
};

export type Organization = {
  slug: string;
  code: string;
  title: string;
  en: string;
  category: string;
  nature: string;
  hq: string;
  summary: string;
  duties: Array<string>;
  units: Array<OrganizationUnit>;
  facilities?: Array<OrganizationFacility>;
  history: Array<OrganizationMilestone>;
};

export const ORGANIZATIONS: Record<string, Organization> = {
  "ueg-gov-001": {
    slug: "ueg-gov-001",
    code: "UEG-GOV-001",
    title: "地球联合政府大会",
    en: "UNITED EARTH GOVERNMENT ASSEMBLY",
    category: "决策与治理",
    nature: "最高决策机关",
    hq: "纽约 · 原联合国大楼",
    summary: "地球联合政府最高权力机关。由各成员代表参与重大议题审议与表决，负责决定影响人类整体未来的重大方案。",
    duties: [
      "审议并表决重大文明工程与长期发展方案",
      "制定并授权全球性公共政策",
      "监督主要政府体系与重大机构运行",
      "代表人类共同体处理重大跨区域事务",
    ],
    units: [
      { title: "大会常务委员会", desc: "大会闭会期间的常设决策机构" },
      { title: "安全理事会", desc: "安全、军事与危机处置核心机构" },
      { title: "秘书处", desc: "最高行政执行机构" },
    ],
    history: [
      { year: "2044", title: "UEG 体系正式建立", desc: "全球治理体系进入新的共同治理阶段。" },
      { year: "2071", title: "重大行星工程进入规划阶段", desc: "大会开始持续审议人类长期生存工程。" },
      { year: "2089", title: "当前纪元", desc: "大会承担全球长期治理与文明延续决策。" },
    ],
  },
  "ueg-gov-002": {
    slug: "ueg-gov-002",
    code: "UEG-GOV-002",
    title: "大会常务委员会",
    en: "STANDING COMMITTEE OF THE ASSEMBLY",
    category: "决策与治理",
    nature: "常设决策机构",
    hq: "纽约 · UEG总部",
    summary: "在地球联合政府大会闭会期间持续行使必要的决策与协调职能，面对重大危机时承担快速响应责任。",
    duties: [
      "处理大会闭会期间重大政策议题",
      "协调全球突发危机的跨部门响应",
      "审议需要快速决策的重大事项",
      "向大会提交持续治理报告",
    ],
    units: [
      { title: "安全理事会", desc: "重大安全事务协调" },
      { title: "秘书处", desc: "行政执行与跨部门协调" },
    ],
    history: [
      { year: "2044", title: "常设制度建立", desc: "承担大会闭会期间的持续治理。" },
      { year: "2086", title: "危机决策体系升级", desc: "紧急状态响应机制进入常态化运行。" },
      { year: "2089", title: "当前纪元", desc: "持续承担全球联合决策支持。" },
    ],
  },
  "ueg-sec-001": {
    slug: "ueg-sec-001",
    code: "UEG-SEC-001",
    title: "安全理事会",
    en: "UNITED EARTH SECURITY COUNCIL",
    category: "军事与安全",
    nature: "安全与危机决策机构",
    hq: "纽约 · UEG安全体系总部",
    summary: "负责全球安全、军事事务及重大危机处置的核心机构，统筹安全体系与紧急状态响应。",
    duties: [
      "审议全球重大安全事务",
      "协调军事与危机响应力量",
      "授权重大安全行动",
      "向大会报告全球安全形势",
    ],
    units: [
      { title: "地球军事委员会", desc: "全球安全军统筹机构" },
      { title: "维和行动部", desc: "全球维和与稳定行动" },
      { title: "政治安全事务司", desc: "政治安全与风险协调" },
    ],
    history: [
      { year: "2044", title: "安全体系形成", desc: "全球安全协调机制完成整合。" },
      { year: "月球危机时期", title: "紧急响应", desc: "承担月球危机期间的联合决策支持。" },
      { year: "2089", title: "当前纪元", desc: "继续承担人类共同安全职责。" },
    ],
  },
  "ueg-exe-001": {
    slug: "ueg-exe-001",
    code: "UEG-EXE-001",
    title: "秘书处",
    en: "UEG SECRETARIAT",
    category: "行政执行",
    nature: "最高行政执行机构",
    hq: "纽约 · UEG总部",
    summary: "联合地球政府最高行政执行体系。秘书长作为行政首长，负责落实大会决议、统筹全球行政及跨部门协调。",
    duties: [
      "落实地球联合政府大会决议",
      "统筹全球行政事务",
      "协调地下城行政体系",
      "组织全球应急救援与跨部门行动",
    ],
    units: [
      { title: "国际合作与救援司", desc: "全球应急救灾与国际协调" },
      { title: "地下城事务部", desc: "地下城规划、准入与行政管理" },
      { title: "经济规划部", desc: "全球经济与资源配置规划" },
      { title: "政治安全事务司", desc: "政治安全事务协调" },
      { title: "时区部", desc: "全球时区与时间基准管理" },
    ],
    history: [
      { year: "2044", title: "行政体系建立", desc: "UEG秘书处承担全球行政执行职能。" },
      { year: "月球危机", title: "全球联合行动", desc: "组织跨部门应急启动与救援协调。" },
      { year: "2089", title: "当前纪元", desc: "承担全球行政与地下城体系协调。" },
    ],
  },
  "ueg-sec-002": {
    slug: "ueg-sec-002",
    code: "UEG-SEC-002",
    title: "地球军事委员会",
    en: "EARTH MILITARY COMMISSION",
    category: "军事与安全",
    nature: "全球军事统帅机构",
    hq: "全球安全体系",
    summary: "负责统帅地球联合政府全球安全军及重要地表、轨道设施的军事安全力量。",
    duties: [
      "统筹全球安全军",
      "负责关键设施安全",
      "协调地表与近地轨道军事行动",
      "支持重大危机处置任务",
    ],
    units: [
      { title: "全球安全军", desc: "UEG全球军事力量" },
      { title: "维和部队", desc: "全球维和与稳定行动力量" },
      { title: "地表守备部队", desc: "关键地表设施守备力量" },
    ],
    history: [
      { year: "体系建立", title: "全球安全军形成", desc: "完成多区域安全力量统一协调。" },
      { year: "危机时期", title: "设施防卫", desc: "参与关键基础设施及航天设施防护。" },
      { year: "2089", title: "当前纪元", desc: "承担全球安全防务职责。" },
    ],
  },
  "ueg-jus-001": {
    slug: "ueg-jus-001",
    code: "UEG-JUS-001",
    title: "地球最高法院",
    en: "SUPREME COURT OF THE EARTH",
    category: "司法体系",
    nature: "最高司法机关",
    hq: "UEG司法体系总部",
    summary: "UEG最高司法机关，负责重大跨区域案件裁决，并对核心法律和地球联合政府法体系进行解释。",
    duties: [
      "审理重大跨区域案件",
      "解释核心法律",
      "监督统一司法适用",
      "处理涉及全球公共利益的重大争议",
    ],
    units: [
      { title: "区域巡回法庭", desc: "跨区域案件巡回审理" },
      { title: "军事法庭", desc: "军事与安全相关案件审理" },
    ],
    history: [
      { year: "UEG成立后", title: "司法体系统一", desc: "建立统一的跨区域司法机制。" },
      { year: "法制完善时期", title: "法典体系形成", desc: "持续完善地球联合政府法律体系。" },
      { year: "2089", title: "当前纪元", desc: "承担全球最高司法职能。" },
    ],
  },
  "ueg-sci-001": {
    slug: "ueg-sci-001",
    code: "UEG-SCI-001",
    title: "联合政府科学院",
    en: "UEG ACADEMY OF SCIENCES",
    category: "科研与工程",
    nature: "最高科研统筹机构",
    hq: "全球科研体系",
    summary: "统筹重大科研计划与文明工程，组织基础科学、前沿技术及人类长期生存相关研究。",
    duties: [
      "统筹重大科研计划",
      "协调全球重点研究机构",
      "承担重大工程科研论证",
      "推动基础科学与前沿技术发展",
    ],
    units: [
      { title: "北京数字生命研究所", desc: "数字生命与量子计算" },
      { title: "重大工程科研委员会", desc: "文明工程科研协调" },
    ],
    history: [
      { year: "2040s", title: "科研体系整合", desc: "建立全球科研协同体系。" },
      { year: "重大工程时期", title: "科研支撑", desc: "承担行星工程与长期文明计划的科研协调。" },
      { year: "2089", title: "当前纪元", desc: "统筹全球重大科研资源。" },
    ],
  },
  "ueg-asa-001": {
    slug: "ueg-asa-001",
    code: "UEG-ASA-001",
    title: "联合政府航空航天局",
    en: "UEG SPACE AGENCY",
    category: "航空航天",
    nature: "航天项目主管机构",
    hq: "全球航空航天体系",
    summary: "负责UEG重大航空航天工程、空间站与月球任务，是人类进入近地轨道及深空时代的核心机构。",
    duties: [
      "统筹重大航天计划",
      "负责月球基地建设与运行",
      "负责领航员空间站项目",
      "协调全球飞行控制与深空任务",
    ],
    units: [
      { title: "UEG月球基地", desc: "月面科研、开采与工程基地" },
      { title: "加蓬联合实验基地", desc: "太空电梯与行星发动机核心工程基地" },
      { title: "UEG飞行控制中心", desc: "逐月计划飞控与航行监控" },
      { title: "领航员空间站", desc: "轨道任务与领航员计划核心设施" },
    ],
    facilities: [
      { anchor: "moon", title: "UEG月球基地", en: "LUNAR & SPACE SCIENCE INTERNATIONAL CENTER", desc: "月球科研、资源开发及逐月计划相关工程。" },
      { anchor: "gabon", title: "加蓬联合实验基地", en: "GABON JOINT ENGINEERING BASE", desc: "太空电梯地面枢纽与行星发动机试验设施。" },
      { anchor: "scc", title: "UEG飞行控制中心", en: "UEG SPACE FLIGHT CONTROL CENTER", desc: "逐月计划飞控、轨道演算及地球航行状态监控。" },
      { anchor: "navigator", title: "领航员空间站", en: "NAVIGATOR SPACE STATION", desc: "领航员计划与重大空间任务核心轨道设施。" },
      { anchor: "engines", title: "全球行星发动机控制网络", en: "PLANETARY ENGINE CONTROL NETWORK", desc: "全球行星发动机控制、维护与运行网络。" },
    ],
    history: [
      { year: "逐月计划", title: "月球工程", desc: "承担月球任务与飞控体系。" },
      { year: "空间站时代", title: "轨道体系", desc: "领航员空间站成为重要空间设施。" },
      { year: "2089", title: "当前纪元", desc: "持续承担人类航天与空间治理任务。" },
    ],
  },
  "ueg-sci-014": {
    slug: "ueg-sci-014",
    code: "UEG-SCI-014",
    title: "北京数字生命研究所",
    en: "BEIJING DIGITAL LIFE RESEARCH INSTITUTE",
    category: "科研与工程",
    nature: "重点科研机构",
    hq: "北京",
    summary: "联合政府科学院下属重点研究机构，承担数字生命、量子计算以及相关前沿技术研究。",
    duties: [
      "数字生命基础研究",
      "量子计算技术研发",
      "重大科研工程支持",
      "高端科研人才组织与培养",
    ],
    units: [
      { title: "量子计算实验中心", desc: "550系列量子计算机研发体系" },
      { title: "数字生命研究中心", desc: "数字生命相关技术研究" },
    ],
    history: [
      { year: "研究所建立", title: "基础研究", desc: "启动数字生命及量子计算方向研究。" },
      { year: "550系列", title: "技术突破", desc: "推进量子计算机研发。" },
      { year: "2089", title: "当前纪元", desc: "持续承担前沿科研任务。" },
    ],
  },
  "ueg-com-001": {
    slug: "ueg-com-001",
    code: "UEG-COM-001",
    title: "UEG 伦理委员会",
    en: "UEG ETHICS COMMISSION",
    category: "专门委员会",
    nature: "跨部门伦理审查机构",
    hq: "UEG中央治理体系",
    summary: "负责重大生命科学、人工智能与新技术应用的伦理审查，为UEG重大科研决策提供伦理框架。",
    duties: [
      "审查重大科技计划伦理风险",
      "制定技术伦理规范",
      "评估涉及人类生命与身份的新技术",
      "向政府提交伦理建议",
    ],
    units: [
      { title: "生命科学伦理组", desc: "生命科学与数字生命" },
      { title: "人工智能伦理组", desc: "人工智能与自动化系统" },
      { title: "新技术审查组", desc: "重大新技术应用" },
    ],
    history: [
      { year: "伦理委员会成立", title: "制度化审查", desc: "重大科技伦理审查机制建立。" },
      { year: "2041", title: "数字生命议题", desc: "推动相关制度与法规进入全球公共审议。" },
      { year: "2089", title: "当前纪元", desc: "持续参与重大技术伦理治理。" },
    ],
  },
  "ueg-com-002": {
    slug: "ueg-com-002",
    code: "UEG-COM-002",
    title: "航行与航道规划委员会",
    en: "NAVIGATION & TRAJECTORY PLANNING COMMISSION",
    category: "专门委员会",
    nature: "航行规划机构",
    hq: "UEG航天治理体系",
    summary: "负责地球轨道、逃逸航线、全球航行工程及重大行星航行计划的长期计算与协调。",
    duties: [
      "规划全球航行路线",
      "计算重大轨道与逃逸航线",
      "协调行星工程航行参数",
      "支持重大航天任务决策",
    ],
    units: [
      { title: "轨道规划组", desc: "地球与近地轨道计算" },
      { title: "航道工程组", desc: "深空与逃逸航线" },
      { title: "行星工程调度组", desc: "整体航行参数协调" },
    ],
    history: [
      { year: "行星工程时期", title: "导航体系建立", desc: "形成长期行星航行规划体系。" },
      { year: "逐月计划", title: "轨道计算", desc: "参与月球任务与全球航行演算。" },
      { year: "2089", title: "当前纪元", desc: "持续支撑人类大规模航行工程。" },
    ],
  },
  "ueg-hum-001": {
    slug: "ueg-hum-001",
    code: "UEG-HUM-001",
    title: "UEG 难民署",
    en: "UEG REFUGEE AGENCY",
    category: "民生与人道",
    nature: "人道救援机构",
    hq: "全球人道体系",
    summary: "负责全球灾害、人口迁移与重大危机时期的难民安置、紧急救援与人道协调。",
    duties: [
      "难民安置与登记",
      "灾区人道救援",
      "全球应急物资协调",
      "人口迁移事务支持",
    ],
    units: [
      { title: "全球救援协调中心", desc: "灾区响应与物资调度" },
      { title: "安置事务中心", desc: "难民转移与长期安置" },
    ],
    history: [
      { year: "危机早期", title: "救援体系建立", desc: "全球难民与救援事务进入统一协调。" },
      { year: "重大灾害时期", title: "人道响应", desc: "承担大规模人口救援与安置。" },
      { year: "2089", title: "当前纪元", desc: "继续提供全球人道公共服务。" },
    ],
  },
  "ueg-hum-002": {
    slug: "ueg-hum-002",
    code: "UEG-HUM-002",
    title: "全球粮食计划署",
    en: "GLOBAL FOOD PROGRAMME",
    category: "民生与人道",
    nature: "全球粮食保障机构",
    hq: "全球粮食体系",
    summary: "负责全球粮食调配、储备与危机时期基本生存保障，维持人类社会关键粮食供应网络。",
    duties: [
      "全球粮食储备",
      "跨区域粮食调配",
      "危机时期配给保障",
      "地下城粮食供应协调",
    ],
    units: [
      { title: "全球储备中心", desc: "战略粮食储备" },
      { title: "区域调配中心", desc: "跨区域物流与配给" },
    ],
    history: [
      { year: "危机早期", title: "全球粮食计划启动", desc: "建立统一粮食协调机制。" },
      { year: "人口迁移时期", title: "地下城供应", desc: "加强长期生存体系保障。" },
      { year: "2089", title: "当前纪元", desc: "维护全球基础粮食安全。" },
    ],
  },
  "ueg-sec-011": {
    slug: "ueg-sec-011",
    code: "UEG-SEC-011",
    title: "经济与社会理事会",
    en: "ECONOMIC & SOCIAL COUNCIL",
    category: "民生与人道",
    nature: "经济与社会治理机构",
    hq: "UEG治理体系",
    summary: "协调全球计划经济、资源分配、人口、卫生及社会事务，是UEG民生治理的重要协调机构。",
    duties: [
      "协调全球资源分配",
      "制定长期人口与社会政策",
      "统筹公共卫生事务",
      "协调全球经济计划",
    ],
    units: [
      { title: "资源协调委员会", desc: "战略资源配置" },
      { title: "人口事务委员会", desc: "人口与迁移政策" },
      { title: "全球卫生协调组", desc: "公共卫生体系" },
    ],
    history: [
      { year: "UEG治理体系形成", title: "社会治理整合", desc: "建立跨区域经济与社会协调机制。" },
      { year: "长期工程时期", title: "资源规划", desc: "参与全球资源和人口长期规划。" },
      { year: "2089", title: "当前纪元", desc: "持续承担社会治理协调职责。" },
    ],
  },
};

export const ORGANIZATION_LIST: Array<Organization> =
  Object.values(ORGANIZATIONS);

export const ORGANIZATION_CATEGORIES: Array<string> = [
  ...new Set(ORGANIZATION_LIST.map((org) => org.category)),
];

export function getOrganization(slug: string): Organization | undefined {
  return ORGANIZATIONS[slug];
}

/** Anchor id used for a subordinate unit, shared with the detail page. */
export function organizationUnitAnchor(title: string): string {
  return `unit-${String(title)
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()}`;
}
