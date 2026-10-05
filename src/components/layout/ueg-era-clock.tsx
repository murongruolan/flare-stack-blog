import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * UEG 纪元时钟：现实时间 +31 年，每秒走字。
 * 格式 yyyy Y mm M dd D（上行）/ hh H mm M ss S（下行），
 * 数字变化时旧数字向上划出、新数字自下划入（滚动钟效果）。
 */

const ERA_YEAR_OFFSET = 31;
const ROLL_MS = 320;

function pad(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

function RollDigit({ value }: { value: string }) {
  const [state, setState] = useState({ prev: value, cur: value, rolling: false });

  useEffect(() => {
    setState((s) => {
      if (s.rolling || value === s.cur) return s;
      return { prev: s.cur, cur: value, rolling: true };
    });
  }, [value, state.rolling]);

  useEffect(() => {
    if (!state.rolling) return;
    const timer = window.setTimeout(() => {
      setState((s) => ({ ...s, rolling: false }));
    }, ROLL_MS);
    return () => window.clearTimeout(timer);
  }, [state.rolling, state.cur]);

  return (
    <span className="era-digit" aria-hidden="true">
      {state.rolling ? (
        <span className="era-digit-roll">
          <span>{state.prev}</span>
          <span>{state.cur}</span>
        </span>
      ) : (
        <span className="era-digit-cur">{state.cur}</span>
      )}
    </span>
  );
}

function EraGroup({ digits, unit }: { digits: string; unit: string }) {
  return (
    <span className="era-group">
      {[...digits].map((char, index) => (
        <RollDigit key={`${unit}-${index}`} value={char} />
      ))}
      <span className="era-unit">{unit}</span>
    </span>
  );
}

export function UegEraClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const era = new Date(now);
  era.setFullYear(now.getFullYear() + ERA_YEAR_OFFSET);

  const dateGroups = [
    { digits: pad(era.getFullYear(), 4), unit: "Y" },
    { digits: pad(era.getMonth() + 1), unit: "M" },
    { digits: pad(era.getDate()), unit: "D" },
  ];
  const timeGroups = [
    { digits: pad(era.getHours()), unit: "H" },
    { digits: pad(era.getMinutes()), unit: "M" },
    { digits: pad(era.getSeconds()), unit: "S" },
  ];

  return (
    <div
      className={cn("ueg-era-clock", className)}
      role="timer"
      aria-label={`UEG 纪元时间 ${dateGroups.map((g) => g.digits + g.unit).join(" ")} ${timeGroups
        .map((g) => g.digits + g.unit)
        .join(" ")}`}
    >
      <span className="era-row">
        {dateGroups.map((group) => (
          <EraGroup key={group.unit} digits={group.digits} unit={group.unit} />
        ))}
      </span>
      <span className="era-row">
        {timeGroups.map((group) => (
          <EraGroup key={group.unit} digits={group.digits} unit={group.unit} />
        ))}
      </span>
    </div>
  );
}
