import { Link } from "@tanstack/react-router";

export type ProgramId = "navigator" | "underground";

const PROGRAMS: Array<{
  id: ProgramId;
  href: string;
  kicker: string;
  title: string;
  en: string;
}> = [
  {
    id: "navigator",
    href: "/navigator",
    kicker: "PROGRAM / 01",
    title: "领航员空间站招募",
    en: "NAVIGATOR SPACE STATION RECRUITMENT · 从候选人登记到面试与资格评估。",
  },
  {
    id: "underground",
    href: "/underground",
    kicker: "PROGRAM / 02",
    title: "地下城资格申请",
    en: "UNDERGROUND CITY ACCESS PROGRAM · 身份登记、城市分配与居民资格抽签体验。",
  },
];

/**
 * Cross-navigation between the two public service programs. The approved
 * reference switched panes inside one document; here each program is its own
 * page, so the sibling entry is a link and the current one stays selected.
 */
export function ProgramTabs({ current }: { current: ProgramId }) {
  return (
    <div className="tabs">
      {PROGRAMS.map((program) => {
        const body = (
          <>
            <div className="k">{program.kicker}</div>
            <h2>{program.title}</h2>
            <p>{program.en}</p>
          </>
        );

        if (program.id === current) {
          return (
            <div key={program.id} className="tab active">
              {body}
            </div>
          );
        }

        return (
          <Link
            key={program.id}
            className="tab"
            to={program.href}
            aria-label={program.title}
          >
            {body}
          </Link>
        );
      })}
    </div>
  );
}
