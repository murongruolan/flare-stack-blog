import { useEffect, useRef, useState } from "react";
import { ProgramTabs } from "./program-tabs";

/** Demonstrative candidate reference shown by the approved reference. */
const CANDIDATE_ID = "NAV-2089-041928";

const ROLES = ["航天驾驶", "飞行控制", "工程技术", "科研任务"];

/**
 * 领航员招募 — candidate registration, interview submission and the
 * qualification record. Split out of the two-pane public service reference.
 */
export function NavigatorPage() {
  const [name, setName] = useState("RUO LAN");
  const [role, setRole] = useState(ROLES[0]);
  const [created, setCreated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const nextRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (created) {
      nextRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [created]);

  useEffect(() => {
    if (confirmed) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [confirmed]);

  const displayName = name.trim() || "UNKNOWN";

  return (
    <div className="ueg-draw-page">
      <ProgramTabs current="navigator" />

      <section className="screen">
        <div className="pane active">
          <div className="eyebrow">UEG AEROSPACE ADMINISTRATION</div>
          <div className="heroTitle">成为人类未来航行的一员。</div>
          <div className="sub">
            NAVIGATOR PROGRAM / RECRUITMENT CYCLE 2089-A
          </div>
          <div className="heroCopy">
            领航员空间站计划面向全球招募候选人。完成身份登记后，你将进入候选人档案系统；通过初步评估后，进入
            UEG 领航员面试流程。
          </div>
          <button
            type="button"
            className="btn"
            onClick={() =>
              document
                .getElementById("navForm")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            开始候选人登记 <b>→</b>
          </button>

          <div className="grid2" id="navForm">
            <div className="box">
              <h3>CANDIDATE REGISTRATION</h3>
              <div className="code">PERSONNEL / NAV / 2089</div>
              <label>
                姓名
                <input
                  id="navName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label>
                申请方向
                <select
                  id="navRole"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  {ROLES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                候选人照片
                <div className="avatar">PREVIEW / PORTRAIT UPLOAD</div>
              </label>
              <button type="button" className="btn" onClick={() => setCreated(true)}>
                建立候选人档案 <b>→</b>
              </button>
            </div>

            <div className="box">
              <h3>CANDIDATE PROFILE</h3>
              <div className="code">LIVE RECORD</div>
              <div className="miniCard">
                <div className="tag">UEG NAVIGATOR PROGRAM</div>
                <div className="photo">PHOTO</div>
                <div className="name">{displayName}</div>
                <div className="id">CANDIDATE ID / {CANDIDATE_ID}</div>
                <div className="notice">
                  {created
                    ? "APPLICATION CREATED / INTERVIEW ELIGIBILITY PENDING"
                    : "APPLICATION NOT CREATED"}
                </div>
              </div>
            </div>
          </div>

          <div ref={nextRef} className={created ? undefined : "hidden"}>
            <div className="stepbar">
              <div className="step done">01 REGISTRATION</div>
              <div className="step current">02 INTERVIEW</div>
              <div className="step">03 ASSESSMENT</div>
              <div className="step">04 RECORD</div>
            </div>
            <div className="terminal">
              <span className="amber">UEG NAVIGATOR INTERVIEW SYSTEM</span>
              <br />
              candidate: <span className="white">{CANDIDATE_ID}</span>
              <br />
              status: <span className="green">INTERVIEW WINDOW OPEN</span>
              <br />
              <br />
              INTERVIEW / 01
              <br />
              <span className="white">
                如果任务要求你在个人安全与任务目标之间作出选择，你的优先级是什么？
              </span>
              <br />
              <br />
              A / 任务目标　 B / 全员生还　 C / 等待地面指令　 D / 重新评估任务
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => setConfirmed(true)}
            >
              提交面试答卷 <b>→</b>
            </button>
          </div>

          <div
            ref={resultRef}
            className={confirmed ? "result show" : "result"}
          >
            <div className="small">UEG AEROSPACE PERSONNEL ASSESSMENT</div>
            <h2>QUALIFIED / 候选资格通过</h2>
            <div className="small">PRELIMINARY NAVIGATOR CANDIDATE</div>
            <div className="idgrid">
              <div className="idbox">
                <span>CANDIDATE ID</span>
                <b>{CANDIDATE_ID}</b>
              </div>
              <div className="idbox">
                <span>ASSESSMENT</span>
                <b>MISSION-READY</b>
              </div>
              <div className="idbox">
                <span>DECISION</span>
                <b>QUALIFIED</b>
              </div>
              <div className="idbox">
                <span>PROGRAM</span>
                <b>NAVIGATOR 2089-A</b>
              </div>
            </div>
            <div className="cardOutput">
              <div className="photo">PORTRAIT</div>
              <div>
                <h3>{displayName}</h3>
                <p>领航员候选人档案已建立。请关注后续 UEG 航空航天局通知。</p>
                <div className="sub">
                  AUTHORIZED / UEG AEROSPACE ADMINISTRATION
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
