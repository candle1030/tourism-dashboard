import { getSupabase } from "@/lib/supabase";
import type { CollectionRun, Place, RegionOverview, TrendRow } from "@/lib/types";
import PlacesExplorer from "@/components/PlacesExplorer";
import RegionSelect from "@/components/RegionSelect";
import TrendChart from "@/components/TrendChart";

// Dashboard는 외부 API를 직접 호출하지 않고 Supabase에 저장된 값만 조회합니다.
export const dynamic = "force-dynamic";

const fmt = (v: number | null | undefined, digits = 1) =>
  v == null ? "–" : Number(v).toLocaleString("ko-KR", { maximumFractionDigits: digits });

const SOURCE_LABEL: Record<string, string> = {
  naver_trend: "NAVER Trend",
  tourism_demand: "관광 수요",
  naver_local: "NAVER Local",
  ai_summary: "AI 요약",
};

export default async function Home({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const { region } = await searchParams;

  let supabase;
  try {
    supabase = getSupabase();
  } catch (e) {
    return <ErrorBox title="환경변수 설정 필요" message={(e as Error).message} />;
  }

  const [regionsRes, trendRes, runsRes] = await Promise.all([
    supabase.from("v_region_overview").select("*").order("region_code"),
    supabase.from("naver_trend").select("reference_date,keyword,ratio").order("reference_date"),
    supabase
      .from("collection_runs")
      .select("run_id,source,started_at,status,row_count,error_message")
      .order("started_at", { ascending: false })
      .limit(8),
  ]);

  const firstError = regionsRes.error ?? trendRes.error ?? runsRes.error;
  if (firstError) return <ErrorBox title="Supabase 조회 실패" message={firstError.message} />;

  const regions = (regionsRes.data ?? []) as RegionOverview[];
  if (regions.length === 0) {
    return <ErrorBox title="지역 데이터 없음" message="regions 테이블이 비어 있습니다. Seed SQL을 먼저 실행하세요." />;
  }

  const defaultRegion = regions.find((r) => r.place_count > 0) ?? regions[0];
  const selected = regions.find((r) => r.region_code === region) ?? defaultRegion;

  const { data: placeData, error: placeError } = await supabase
    .from("local_places")
    .select("id,region_code,search_category,name,category,address,road_address,latitude,longitude,source_link")
    .eq("region_code", selected.region_code)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("search_category")
    .limit(100);
  if (placeError) return <ErrorBox title="장소 조회 실패" message={placeError.message} />;
  const places = (placeData ?? []) as Place[];

  const trend = (trendRes.data ?? []) as TrendRow[];
  const runs = (runsRes.data ?? []) as CollectionRun[];

  const withStay = regions.filter((r) => r.stay_strength != null);
  const rankOf = (key: "stay_strength" | "consumption_strength") => {
    const list = regions.filter((r) => r[key] != null).sort((a, b) => Number(b[key]) - Number(a[key]));
    const i = list.findIndex((r) => r.region_code === selected.region_code);
    return i >= 0 ? `${list.length}개 지역 중 ${i + 1}위` : "데이터 없음";
  };
  const maxStay = Math.max(1, ...withStay.map((r) => Number(r.stay_strength)));
  const center =
    selected.center_lat != null && selected.center_lng != null
      ? { lat: selected.center_lat, lng: selected.center_lng }
      : null;

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-3">AI 기반 지역 관광 수요 및 관광 인프라 탐색</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{selected.region_name}</h1>
        </div>
        <RegionSelect options={regions} value={selected.region_code} />
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="핵심 지표">
        <Kpi label="관광 수요 기준월" value={selected.reference_date ? selected.reference_date.slice(0, 7) : "–"} note="한국관광공사 · 월 1회 갱신" />
        <Kpi label="관광 체류 강도" value={fmt(selected.stay_strength, 2)} note={rankOf("stay_strength")} />
        <Kpi label="관광 소비 강도" value={fmt(selected.consumption_strength, 2)} note={rankOf("consumption_strength")} />
        <Kpi label="수집된 장소" value={`${selected.place_count}곳`} note="NAVER Local 대표 장소" />
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <div className="card p-4 sm:p-5 lg:col-span-3">
          <h2 className="mb-3 font-semibold">관광 장소 지도</h2>
          <PlacesExplorer places={places} center={center} />
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div className="card p-4 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">AI 지역 분석</h2>
              <span className="text-xs text-ink-3">
                {selected.analysis_date ? `${selected.analysis_date} · ${selected.model_name ?? ""}` : "생성 전"}
              </span>
            </div>
            {selected.summary ? (
              <div className="space-y-3 text-sm leading-relaxed">
                <p className="whitespace-pre-line text-ink">{selected.summary}</p>
                {selected.limitations && (
                  <div className="rounded-lg border border-line p-3">
                    <div className="mb-1 text-xs font-medium text-ink-3">데이터 한계</div>
                    <p className="whitespace-pre-line text-ink-2">{selected.limitations}</p>
                  </div>
                )}
                <p className="text-xs text-ink-3">
                  AI 문장은 Supabase에 저장된 값을 요약한 것이며 검증된 사실이 아닙니다. 수치는 위 지표를 기준으로 확인하세요.
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink-3">아직 이 지역의 AI 요약이 없습니다. (Make AI 시나리오가 매일 생성)</p>
            )}
          </div>

          <div className="card p-4 sm:p-5">
            <h2 className="mb-3 font-semibold">지역별 관광 체류 강도</h2>
            {withStay.length === 0 ? (
              <p className="text-sm text-ink-3">관광 수요 데이터가 아직 수집되지 않았습니다.</p>
            ) : (
              <ul className="space-y-1.5">
                {[...withStay]
                  .sort((a, b) => Number(b.stay_strength) - Number(a.stay_strength))
                  .map((r) => {
                    const on = r.region_code === selected.region_code;
                    return (
                      <li key={r.region_code} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2 text-sm">
                        <span className={on ? "font-semibold" : "text-ink-2"}>{r.region_name}</span>
                        <span className="h-2 rounded-r" style={{
                          width: `${(Number(r.stay_strength) / maxStay) * 100}%`,
                          background: on ? "var(--series-1)" : "var(--border)",
                        }} />
                        <span className="text-right tabular-nums text-ink-2">{fmt(r.stay_strength)}</span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">NAVER 검색 관심도 추이</h2>
        <TrendChart rows={trend} />
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">수집 상태 (Make → Supabase)</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-ink-3">아직 Make 수집 기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] whitespace-nowrap text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-3">
                  <th className="py-1.5 pr-3 font-medium">시각</th>
                  <th className="py-1.5 pr-3 font-medium">소스</th>
                  <th className="py-1.5 pr-3 font-medium">상태</th>
                  <th className="py-1.5 pr-3 text-right font-medium">행 수</th>
                  <th className="py-1.5 font-medium">메시지</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.run_id} className="border-b border-line/60">
                    <td className="py-1.5 pr-3 tabular-nums text-ink-2">
                      {new Date(r.started_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-1.5 pr-3">{SOURCE_LABEL[r.source] ?? r.source}</td>
                    <td className="py-1.5 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden className="inline-block h-2 w-2 rounded-full"
                          style={{ background: r.status === "SUCCESS" ? "var(--good)" : "var(--critical)" }} />
                        {r.status === "SUCCESS" ? "성공" : "실패"}
                      </span>
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.row_count}</td>
                    <td className="max-w-[18rem] truncate py-1.5 text-ink-3" title={r.error_message ?? ""}>{r.error_message ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="pb-4 text-xs text-ink-3">
        데이터: NAVER Search Trend · 한국관광공사 지역별 관광 수요 강도 · NAVER Local Search — Make가 수집해 Supabase에 저장한 값을 표시합니다.
      </footer>
    </main>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-ink-3">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-ink-3">{note}</div>
    </div>
  );
}

function ErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="card p-6">
        <h1 className="text-lg font-semibold">{title}</h1>
        <pre className="mt-3 whitespace-pre-wrap text-sm text-ink-2">{message}</pre>
      </div>
    </main>
  );
}
