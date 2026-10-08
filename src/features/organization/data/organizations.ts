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
  /** Long-form archive description, rendered as prose on the detail page. */
  intro: Array<string>;
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
    intro: [
      "地球联合政府大会依《联合地球政府宪章》设立，为联合地球政府最高权力机关，2044 年全球治理体系整合后正式运行，会址设于纽约原联合国大楼。大会由各成员代表组成，代表人类共同体行使最高审议与表决权。",
      "大会审议并表决重大文明工程与长期发展方案，制定并授权全球性公共政策，监督秘书处、安全理事会等主要政府体系运行，并就跨区域重大事务作出决定。凡涉及人类整体存续的长期方案，均须经大会表决通过后方可实施。",
      "大会闭会期间，由大会常务委员会代行必要的持续决策与协调职能；重大安全事务提交安全理事会审议；大会决议由秘书处负责执行。2071 年起，人类长期生存工程相关方案持续列入大会审议日程，并构成当前纪元大会工作的核心议题。",
    ],
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
    intro: [
      "大会常务委员会依大会授权设立，为地球联合政府大会闭会期间的常设决策机构，会址设于纽约 UEG 总部。常委会在大会闭会期间持续行使必要的决策与协调职能，确保全球治理不因会期中断。",
      "常委会负责处理大会闭会期间的重大政策议题，审议需要快速决策的重大事项，并协调全球突发危机的跨部门响应。凡因时效无法等待大会复会的重大事项，由常委会作出决定，并向大会提交持续治理报告。",
      "常委会与安全理事会、秘书处保持直接工作关系：重大安全事务提交安全理事会审议，决议执行由秘书处承担。2086 年危机决策体系升级后，紧急状态响应机制进入常态化运行，构成当前纪元常委会工作的重点。",
    ],
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
    intro: [
      "安全理事会为联合地球政府安全与危机决策机构，2044 年全球安全协调机制完成整合后运行，会址设于纽约 UEG 安全体系总部。理事会向大会负责，审议全球重大安全事务。",
      "理事会协调军事与危机响应力量，授权重大安全行动，并定期向大会报告全球安全形势。其下属地球军事委员会承担全球安全军的统筹指挥，维和行动部与政治安全事务司分别负责稳定行动与政治安全协调。",
      "月球危机期间，理事会承担联合决策支持，紧急响应机制在此后延续运行。当前纪元下，理事会继续承担人类共同安全职责。",
    ],
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
    intro: [
      "秘书处为联合地球政府最高行政执行体系，秘书长作为行政首长，向大会负责。秘书处会址设于纽约 UEG 总部，承担大会决议的落实与全球行政协调。",
      "秘书处统筹全球行政事务，协调地下城行政体系，并组织全球应急救援与跨部门行动。其下设国际合作与救援司、地下城事务部、经济规划部、政治安全事务司、时区部等机构，分别负责国际协调与救灾、地下城规划与准入管理、经济与资源配置规划、政治安全事务，以及全球时区与时间基准管理。",
      "月球危机期间，秘书处组织跨部门应急启动与救援协调，形成全球联合行动机制。当前纪元下，秘书处继续承担全球行政与地下城体系协调职责。",
    ],
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
    intro: [
      "地球军事委员会为联合地球政府全球军事统帅机构，隶属安全理事会，负责统筹全球安全军及重要地表、轨道设施的军事安全力量。",
      "委员会协调地表与近地轨道军事行动，负责关键基础设施及航天设施的防卫，并支持重大危机处置任务。其下属全球安全军为 UEG 全球军事力量，维和部队与地表守备部队分别承担稳定行动与关键地表设施守备。",
      "全球安全军形成于多区域安全力量的统一协调之后，危机时期参与关键基础设施及航天设施的防护。当前纪元下，委员会继续承担全球安全防务职责。",
    ],
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
    intro: [
      "地球最高法院为联合地球政府最高司法机关，于 UEG 成立后建立统一的跨区域司法机制，院址设于 UEG 司法体系总部。",
      "法院负责审理重大跨区域案件，对核心法律与地球联合政府法体系进行解释，并监督司法适用的统一。涉及全球公共利益的重大争议，由法院处理。",
      "法院下设区域巡回法庭与军事法庭，分别承担跨区域案件巡回审理，以及军事与安全相关案件审理。法制完善时期形成的法典体系，构成当前司法适用的基础。",
    ],
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
    intro: [
      "联合政府科学院为联合地球政府最高科研统筹机构，于 2040 年代全球科研力量整合中组建，负责统筹重大科研计划、协调全球重点研究机构，并就重大工程组织科研论证。",
      "科学院承担基础科学与前沿技术领域的组织协调工作，研究方向覆盖行星工程支撑技术、深空航行与人类长期生存相关的重大课题。凡涉及文明延续的关键技术路线，均须经科学院组织论证后提交大会审议。",
      "科学院下设北京数字生命研究所、重大工程科研委员会等机构，分别承担数字生命与量子计算、文明工程科研协调等方向的科研任务。当前纪元下，科学院统筹全球重大科研资源，为各项长期工程提供科学支撑。",
    ],
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
    intro: [
      "联合政府航空航天局为联合地球政府航天项目主管机构，统筹逐月计划、月球基地、领航员空间站及重大空间任务，是联合政府进入近地轨道与深空时代的核心执行机构。",
      "航空航天局负责重大航天计划的组织与实施，协调全球飞行控制体系与深空航行任务，并主管月球科研、资源开发与太空电梯地面枢纽等关键工程设施。当前纪元下，其下属设施构成 UEG 空间能力的主要支撑体系。",
    ],
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
    intro: [
      "北京数字生命研究所为联合政府科学院下属重点研究机构，设于北京，承担数字生命、量子计算及相关前沿技术研究。",
      "研究所开展数字生命基础研究与量子计算技术研发，为重大科研工程提供支持，并负责高端科研人才的组织与培养。其下设量子计算实验中心，承担 550 系列量子计算机研发体系；数字生命研究中心负责数字生命相关技术研究。",
      "550 系列推进后，研究所的量子计算研发进入新的阶段。当前纪元下，研究所继续承担前沿科研任务。",
    ],
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
    intro: [
      "UEG 伦理委员会为跨部门伦理审查机构，隶属 UEG 中央治理体系，负责重大生命科学、人工智能与新技术应用的伦理审查，为重大科研决策提供伦理框架。",
      "委员会审查重大科技计划的伦理风险，制定技术伦理规范，评估涉及人类生命与身份的新技术，并向政府提交伦理建议。其下设生命科学伦理组、人工智能伦理组与新技术审查组，分别覆盖生命科学与数字生命、人工智能与自动化系统，以及重大新技术应用等方向。",
      "2041 年数字生命议题进入全球公共审议，委员会推动了相关制度与法规的建立。当前纪元下，委员会持续参与重大技术伦理治理。",
    ],
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
    intro: [
      "航行与航道规划委员会为 UEG 航天治理体系下的航行规划机构，负责地球轨道、逃逸航线、全球航行工程及重大行星航行计划的长期计算与协调。",
      "委员会规划全球航行路线，计算重大轨道与逃逸航线，协调行星工程航行参数，并为重大航天任务决策提供支持。其下设轨道规划组、航道工程组与行星工程调度组，分别承担地球与近地轨道计算、深空与逃逸航线设计，以及整体航行参数协调。",
      "行星工程时期建立长期行星航行规划体系后，委员会在逐月计划中参与月球任务与全球航行演算。当前纪元下，委员会持续支撑人类大规模航行工程。",
    ],
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
    intro: [
      "UEG 难民署为全球人道救援机构，隶属全球人道体系，负责全球灾害、人口迁移与重大危机时期的难民安置、紧急救援与人道协调。",
      "难民署承担难民安置与登记、灾区人道救援、全球应急物资协调及人口迁移事务支持。其下设全球救援协调中心与安置事务中心，分别负责灾区响应与物资调度，以及难民转移与长期安置。",
      "重大灾害时期，难民署承担大规模人口救援与安置任务。当前纪元下，难民署继续提供全球人道公共服务。",
    ],
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
    intro: [
      "全球粮食计划署为全球粮食保障机构，隶属全球粮食体系，负责全球粮食调配、储备与危机时期的基本生存保障，维持人类社会关键粮食供应网络。",
      "计划署管理全球粮食储备，组织跨区域粮食调配，保障危机时期的配给供应，并协调地下城粮食供应。其下设全球储备中心与区域调配中心，分别承担战略粮食储备，以及跨区域物流与配给。",
      "人口迁移时期，计划署加强了长期生存体系下的粮食保障。当前纪元下，计划署继续维护全球基础粮食安全。",
    ],
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
    intro: [
      "经济与社会理事会为 UEG 治理体系下的经济与社会治理机构，协调全球计划经济、资源分配、人口、卫生及社会事务。",
      "理事会协调全球资源分配，制定长期人口与社会政策，统筹公共卫生事务，并协调全球经济计划。其下设资源协调委员会、人口事务委员会与全球卫生协调组，分别承担战略资源配置、人口与迁移政策，以及公共卫生体系协调。",
      "UEG 治理体系形成时期完成跨区域经济与社会协调机制的整合，长期工程时期参与全球资源与人口长期规划。当前纪元下，理事会持续承担社会治理协调职责。",
    ],
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
