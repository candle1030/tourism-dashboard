"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { PLACE_CATEGORIES, SERIES_VARS, type Place } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    naver: any;
  }
}

type Props = {
  places: Place[];
  center: { lat: number; lng: number } | null;
};

const KOREA_CENTER = { lat: 36.35, lng: 127.8 };

function colorOf(category: string) {
  const i = PLACE_CATEGORIES.indexOf(category as (typeof PLACE_CATEGORIES)[number]);
  return i >= 0 ? SERIES_VARS[i] : "var(--text-muted)";
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export default function NaverMap({ places, center }: Props) {
  const keyId = process.env.NEXT_PUBLIC_NAVER_MAP_NCP_KEY_ID;
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Script의 onReady는 이미 로드된 상태로 다시 마운트돼도 호출됩니다.
  useEffect(() => {
    // NAVER Maps 인증 실패 시 호출되는 전역 콜백
    (window as any).navermap_authFailure = () => setAuthError(true);
  }, []);

  const draw = useCallback(() => {
    if (!ready || !mapEl.current) return;
    const { maps } = window.naver;
    const c = center ?? KOREA_CENTER;

    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapEl.current, {
        center: new maps.LatLng(c.lat, c.lng),
        zoom: center ? 11 : 7,
        zoomControl: true,
        zoomControlOptions: { position: maps.Position.TOP_RIGHT },
      });
      infoRef.current = new maps.InfoWindow({ borderWidth: 0, backgroundColor: "transparent", disableAnchor: true });
    }
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    infoRef.current?.close();

    const valid = places.filter((p) => p.latitude != null && p.longitude != null);
    valid.forEach((p) => {
      const color = colorOf(p.search_category);
      const marker = new maps.Marker({
        // NAVER Local: mapx = 경도(longitude), mapy = 위도(latitude)
        position: new maps.LatLng(p.latitude, p.longitude),
        map,
        title: p.name,
        icon: {
          content: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid var(--surface-1);box-shadow:0 1px 3px rgba(0,0,0,.35)"></div>`,
          anchor: new maps.Point(8, 8),
        },
      });
      maps.Event.addListener(marker, "click", () => {
        const addr = escapeHtml(p.road_address || p.address || "");
        const link = p.source_link
          ? `<a href="${escapeHtml(p.source_link)}" target="_blank" rel="noreferrer" style="color:var(--accent)">링크</a>`
          : "";
        infoRef.current.setContent(
          `<div style="background:var(--surface-1);color:var(--text-primary);border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:13px;max-width:240px;box-shadow:0 4px 12px rgba(0,0,0,.15)">
             <div style="font-weight:600">${escapeHtml(p.name)}</div>
             <div style="color:var(--text-secondary);margin-top:2px">${escapeHtml(p.search_category)} · ${escapeHtml(p.category ?? "")}</div>
             <div style="color:var(--text-muted);margin-top:4px">${addr} ${link}</div>
           </div>`
        );
        infoRef.current.open(map, marker);
      });
      markersRef.current.push(marker);
    });

    if (valid.length > 1) {
      const bounds = new maps.LatLngBounds(
        new maps.LatLng(valid[0].latitude, valid[0].longitude),
        new maps.LatLng(valid[0].latitude, valid[0].longitude)
      );
      valid.forEach((p) => bounds.extend(new maps.LatLng(p.latitude, p.longitude)));
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else {
      map.setCenter(new maps.LatLng(c.lat, c.lng));
      map.setZoom(center ? 11 : 7);
    }
  }, [ready, places, center]);

  useEffect(() => {
    draw();
  }, [draw]);

  if (!keyId) {
    return (
      <div className="flex h-[440px] items-center justify-center rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-2">
        NEXT_PUBLIC_NAVER_MAP_NCP_KEY_ID가 설정되지 않아 지도를 표시할 수 없습니다.
      </div>
    );
  }

  return (
    <div className="relative">
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${keyId}`}
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div ref={mapEl} className="h-[440px] w-full overflow-hidden rounded-xl bg-background" />
      {authError && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface/95 p-6 text-center text-sm text-ink-2">
          NAVER Maps 인증에 실패했습니다. NCP 콘솔의 Maps Application에 현재 주소(예: http://localhost:3000, Vercel 도메인)가 Web 서비스 URL로 등록되어 있는지 확인하세요.
        </div>
      )}
    </div>
  );
}
