export type RegionOverview = {
  region_code: string;
  region_name: string;
  area_cd: string | null;
  sigungu_name: string | null;
  center_lat: number | null;
  center_lng: number | null;
  reference_date: string | null;
  stay_strength: number | null;
  consumption_strength: number | null;
  place_count: number;
  places_updated_at: string | null;
  analysis_date: string | null;
  summary: string | null;
  limitations: string | null;
  llm_provider: string | null;
  model_name: string | null;
};

export type Place = {
  id: number;
  region_code: string | null;
  search_category: string;
  name: string;
  category: string | null;
  address: string | null;
  road_address: string | null;
  latitude: number | null;
  longitude: number | null;
  source_link: string | null;
};

export type TrendRow = { reference_date: string; keyword: string; ratio: number };

export type CollectionRun = {
  run_id: string;
  source: string;
  started_at: string;
  status: string;
  row_count: number;
  error_message: string | null;
};

// 장소 카테고리 = 고정 순서의 범주형 색 (순위가 아니라 항목에 색을 고정)
export const PLACE_CATEGORIES = ["관광지", "맛집", "카페", "숙박"] as const;
export const SERIES_VARS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];
export const TREND_KEYWORDS = ["여행", "축제", "캠핑", "맛집"] as const;
