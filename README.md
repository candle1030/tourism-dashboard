# tourism-dashboard (Chapter 14-2)

AI 기반 지역 관광 수요 및 관광 인프라 탐색 Dashboard — Next.js + Supabase + NAVER Maps + Recharts

Dashboard는 외부 API를 호출하지 않고 **Supabase에 저장된 값만 조회**합니다 (Make → Supabase → Dashboard).

## 로컬 실행 (Windows PowerShell)

```powershell
cd C:\dev\llm-data-analysis-course\chapter14-2\tourism-dashboard
npm install
Copy-Item .env.example .env.local   # 값 채우기
npm run dev                          # http://localhost:3000
```

`.env.local`

| 변수 | 값 |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | https://vfuutvdttitelrgnynio.supabase.co |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Supabase → Settings → API Keys → Publishable key (`sb_publishable_...`) |
| NEXT_PUBLIC_NAVER_MAP_NCP_KEY_ID | NCP 콘솔 → Maps → Application의 Client ID |

Secret Key(`sb_secret_...`)는 여기에 넣지 않습니다.

## 화면 구성

- 지역 선택 → KPI(관광 수요 기준월 · 체류 강도 · 소비 강도 · 장소 수)
- NAVER Maps 장소 Marker + 카테고리 필터(관광지/맛집/카페/숙박)
- AI 지역 분석 (Make가 하루 1회 생성해 저장한 결과)
- 지역별 관광 체류 강도 비교
- NAVER 검색 관심도 추이 (기간 선택 · 표 보기)
- 수집 상태 (collection_runs)

## 배포 (Vercel)

GitHub 저장소 Import → Environment Variables에 위 3개 등록 → Deploy.
NAVER Maps Application의 Web 서비스 URL에 `http://localhost:3000`과 Vercel 도메인을 둘 다 등록해야 지도가 뜹니다.
