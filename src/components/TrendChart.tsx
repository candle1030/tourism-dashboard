"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SERIES_VARS, TREND_KEYWORDS, type TrendRow } from "@/lib/types";

const RANGES = [
  { label: "6개월", months: 6 },
  { label: "12개월", months: 12 },
  { label: "전체", months: 0 },
];

export default function TrendChart({ rows }: { rows: TrendRow[] }) {
  const [months, setMonths] = useState(12);
  const [showTable, setShowTable] = useState(false);

  const data = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    rows.forEach((r) => {
      const d = r.reference_date.slice(0, 7);
      const row = byDate.get(d) ?? { period: d };
      row[r.keyword] = Number(r.ratio);
      byDate.set(d, row);
    });
    const all = [...byDate.values()].sort((a, b) => String(a.period).localeCompare(String(b.period)));
    return months ? all.slice(-months) : all;
  }, [rows, months]);

  const keywords = TREND_KEYWORDS.filter((k) => rows.some((r) => r.keyword === k));

  if (rows.length === 0) {
    return <p className="text-sm text-ink-3">NAVER 검색 관심도 데이터가 아직 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => setMonths(r.months)}
            aria-pressed={months === r.months}
            className={`rounded-full border px-3 py-1 text-sm ${
              months === r.months ? "border-ink-3 bg-surface text-ink" : "border-line text-ink-3"
            }`}
          >
            {r.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="ml-auto rounded-full border border-line px-3 py-1 text-sm text-ink-2"
        >
          {showTable ? "차트 보기" : "표 보기"}
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="border-b border-line text-left text-ink-3">
                <th className="py-1.5 pr-4 font-medium">월</th>
                {keywords.map((k) => (
                  <th key={k} className="py-1.5 pr-4 text-right font-medium">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={String(row.period)} className="border-b border-line/60">
                  <td className="py-1.5 pr-4 text-ink-2">{row.period}</td>
                  {keywords.map((k) => (
                    <td key={k} className="py-1.5 pr-4 text-right">
                      {row[k] != null ? Number(row[k]).toFixed(1) : "–"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                minTickGap={16}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text-primary)",
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--text-secondary)" }}
                itemStyle={{ color: "var(--text-primary)" }}
                formatter={(v) => (typeof v === "number" ? v.toFixed(1) : String(v))}
                cursor={{ stroke: "var(--text-muted)", strokeDasharray: "3 3" }}
              />
              <Legend itemSorter={null} formatter={(v) => <span style={{ color: "var(--text-secondary)" }}>{v}</span>} wrapperStyle={{ fontSize: 13, color: "var(--text-secondary)" }} iconType="circle" iconSize={8} />
              {keywords.map((k) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={k}
                  stroke={SERIES_VARS[TREND_KEYWORDS.indexOf(k)]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, stroke: "var(--surface-1)", strokeWidth: 2 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="text-xs text-ink-3">
        상대 관심도(조회 기간 최댓값 = 100)이며 실제 검색 건수가 아닙니다. 지역 구분이 없는 전국 수준 값입니다. 최신 월은 집계 중인 부분 월일 수 있습니다.
      </p>
    </div>
  );
}
