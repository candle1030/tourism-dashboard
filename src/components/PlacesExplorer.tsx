"use client";

import { useMemo, useState } from "react";
import NaverMap from "./NaverMap";
import { PLACE_CATEGORIES, SERIES_VARS, type Place } from "@/lib/types";

type Props = {
  places: Place[];
  center: { lat: number; lng: number } | null;
};

export default function PlacesExplorer({ places, center }: Props) {
  const [active, setActive] = useState<string[]>([...PLACE_CATEGORIES]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    places.forEach((p) => m.set(p.search_category, (m.get(p.search_category) ?? 0) + 1));
    return m;
  }, [places]);

  const visible = useMemo(() => places.filter((p) => active.includes(p.search_category)), [places, active]);

  const toggle = (c: string) =>
    setActive((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="장소 카테고리">
        {PLACE_CATEGORIES.map((c, i) => {
          const on = active.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              aria-pressed={on}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                on ? "border-ink-3 bg-surface text-ink" : "border-line text-ink-3"
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: SERIES_VARS[i], opacity: on ? 1 : 0.35 }}
              />
              {c}
              <span className="text-ink-3">{counts.get(c) ?? 0}</span>
            </button>
          );
        })}
      </div>

      <NaverMap places={visible} center={center} />

      {visible.length === 0 ? (
        <p className="text-sm text-ink-3">
          이 지역은 아직 NAVER Local 장소가 수집되지 않았습니다. (Make 시나리오가 하루 한 지역씩 수집합니다)
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visible.map((p) => (
            <li key={p.id} className="flex gap-3 rounded-lg border border-line px-3 py-2 text-sm">
              <span
                className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: SERIES_VARS[PLACE_CATEGORIES.indexOf(p.search_category as never)] ?? "var(--text-muted)" }}
              />
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {p.source_link ? (
                    <a href={p.source_link} target="_blank" rel="noreferrer" className="hover:underline">
                      {p.name}
                    </a>
                  ) : (
                    p.name
                  )}
                </div>
                <div className="truncate text-ink-3">
                  {p.search_category} · {p.road_address || p.address || "주소 없음"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
