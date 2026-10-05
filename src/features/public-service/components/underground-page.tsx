import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ProgramTabs } from "./program-tabs";

/** Demonstrative application reference shown by the approved reference. */
const APPLICATION_ID = "UGC-2089-728391";

const FAMILY_SIZES = ["1", "2", "3", "4", "5+"];
const OCCUPATIONS = [
  "工程技术",
  "医疗",
  "科研教育",
  "农业",
  "制造业",
  "其他",
];

type LotteryPhase = 0 | 1 | 2 | 3;

/**
 * 地下城资格 — resident registration and the allocation draw.
 * Split out of the two-pane public service reference.
 */
export function UndergroundPage() {
  const [name, setName] = useState("RUO LAN");
  const [family, setFamily] = useState("3");
  const [occupation, setOccupation] = useState(OCCUPATIONS[0]);
  const [created, setCreated] = useState(false);
  const [phase, setPhase] = useState<LotteryPhase>(0);

  const nextRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (created) {
      nextRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [created]);

  // Lottery timing mirrors the reference: draw selection at 1.9s, complete at 3.9s.
  useEffect(() => {
    if (phase === 1) {
      const timer = window.setTimeout(() => setPhase(2), 1900);
      return () => window.clearTimeout(timer);
    }
    if (phase === 2) {
      const timer = window.setTimeout(() => setPhase(3), 2000);
      return () => window.clearTimeout(timer);
    }
    if (phase === 3) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return undefined;
  }, [phase]);

  const displayName = name.trim() || "UNKNOWN";
  const spinning = phase === 1 || phase === 2;

  return (
    <div className="ueg-draw-page">
      <ProgramTabs current="underground" />

      <section className="screen">
        <div className="pane active">
          <div className="eyebrow">UEG CIVILIAN SERVICES</div>
          <div className="heroTitle">申请你的地下城居住资格。</div>
          <div className="sub">
            UNDERGROUND CITY ACCESS PROGRAM / LOTTERY CYCLE 2089-B
          </div>
          <div className="heroCopy">
            完成居民资料登记后，你将获得本批次候选编号。公开抽签不会即时展示内部计算过程，系统将在资格池完成校验后进行最终分配。
          </div>
          <button
            type="button"
            className="btn"
            onClick={() =>
              document
                .getElementById("ugcForm")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            进入资格登记 <b>→</b>
          </button>

          <div className="grid2" id="ugcForm">
            <div className="box">
              <h3>CIVILIAN REGISTRATION</h3>
              <div className="code">CITIZEN SERVICES / UGC / 2089</div>
              <label>
                姓名
                <input
                  id="ugcName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label>
                家庭成员
                <select
                  value={family}
                  onChange={(event) => setFamily(event.target.value)}
                >
                  {FAMILY_SIZES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                职业
                <select
                  value={occupation}
                  onChange={(event) => setOccupation(event.target.value)}
                >
                  {OCCUPATIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="btn" onClick={() => setCreated(true)}>
                提交居民资料 <b>→</b>
              </button>
            </div>

            <div className="box">
              <h3>APPLICATION RECORD</h3>
              <div className="code">LIVE RECORD</div>
              <div className="miniCard">
                <div className="tag">UNDERGROUND CITY ACCESS</div>
                <div className="photo">PHOTO</div>
                <div className="name">{displayName}</div>
                <div className="id">APPLICATION / {APPLICATION_ID}</div>
                <div className="notice">
                  {created
                    ? "PENDING LOTTERY / LOTTERY CYCLE 2089-B"
                    : "APPLICATION NOT CREATED"}
                </div>
              </div>
            </div>
          </div>

          <div ref={nextRef} className={created ? undefined : "hidden"}>
            <div className="stepbar">
              <div className="step done">01 REGISTRATION</div>
              <div className="step current">02 LOTTERY</div>
              <div className="step">03 ALLOCATION</div>
              <div className="step">04 RESIDENT RECORD</div>
            </div>
            <div className="grid2">
              <div>
                <div className={cn("lotteryMachine", spinning && "spin")}>
                  <div className="ring r1" />
                  <div className="ring r2" />
                  <div className="ring r3" />
                  <div className="core" />
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setPhase((current) => (current === 0 ? 1 : current))}
                  disabled={phase !== 0}
                >
                  {phase === 3 ? "抽签已完成" : "参与本批次抽签"} <b>→</b>
                </button>
              </div>

              <div className="terminal">
                {phase === 0 ? (
                  <>
                    LOTTERY SYSTEM READY
                    <br />
                    candidate: <span className="white">{APPLICATION_ID}</span>
                    <br />
                    pool status: <span className="green">OPEN</span>
                    <br />
                    <br />
                    waiting for candidate action...
                  </>
                ) : null}

                {phase === 1 ? (
                  <>
                    LOTTERY SYSTEM INITIALIZING...
                    <br />
                    population balance: <span className="amber">CALCULATING</span>
                    <br />
                    city capacity: <span className="amber">CALCULATING</span>
                    <br />
                    allocation pool: <span className="amber">LOCKED</span>
                  </>
                ) : null}

                {phase === 2 ? (
                  <>
                    FINAL ALLOCATION
                    <br />
                    candidate pool: <span className="green">VERIFIED</span>
                    <br />
                    draw state: <span className="amber">SELECTING</span>
                    <br />
                    <br />
                    processing...
                  </>
                ) : null}

                {phase === 3 ? (
                  <>
                    FINAL ALLOCATION
                    <br />
                    draw state: <span className="green">COMPLETE</span>
                    <br />
                    result: <span className="white">CANDIDATE SELECTED</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div
            ref={resultRef}
            className={phase === 3 ? "result show" : "result"}
          >
            <div className="small">
              UEG UNDERGROUND CITY RESIDENT ALLOCATION
            </div>
            <h2>CONGRATULATIONS / 资格通过</h2>
            <div className="small">RESIDENT ALLOCATION CONFIRMED</div>
            <div className="idgrid">
              <div className="idbox">
                <span>CITIZEN ID</span>
                <b>{APPLICATION_ID}</b>
              </div>
              <div className="idbox">
                <span>CITY</span>
                <b>BEIJING UNDERGROUND CITY</b>
              </div>
              <div className="idbox">
                <span>ZONE</span>
                <b>C-14</b>
              </div>
              <div className="idbox">
                <span>STATUS</span>
                <b>ACTIVE</b>
              </div>
            </div>
            <div className="cardOutput">
              <div className="photo">PORTRAIT</div>
              <div>
                <h3>{displayName}</h3>
                <p>居民资格已通过并完成城市分配。你的 UEG 居民档案已经建立。</p>
                <div className="sub">
                  UNDERGROUND CITY CIVILIAN IDENTIFICATION
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
