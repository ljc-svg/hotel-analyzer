import { useEffect, useRef, useState } from 'react';
import { loadKakaoMapSDK, hasKakaoMapKey } from '@/lib/kakaoMap';
import type { KakaoMap, KakaoMarker, KakaoInfoWindow } from '@/lib/kakaoMap';

interface KakaoMapViewProps {
  lat?: number;
  lng?: number;
  siteName?: string;
  infoContent?: string; // HTML string for info window
}

const HERO_IMAGE = 'https://mgx-backend-cdn.metadl.com/generate/images/1264998/2026-05-24/pgarb7iaagsa/hero-hotel-analytics-dashboard.png';

export default function KakaoMapView({ lat, lng, siteName, infoContent }: KakaoMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const infoWindowRef = useRef<KakaoInfoWindow | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  // SDK 로드
  useEffect(() => {
    if (!hasKakaoMapKey()) return;
    loadKakaoMapSDK().then((loaded) => {
      setSdkReady(loaded);
    });
  }, []);

  // 지도 초기화 및 업데이트
  useEffect(() => {
    if (!sdkReady || !mapContainerRef.current || !lat || !lng) return;

    const kakao = window.kakao;
    const center = new kakao.maps.LatLng(lat, lng);

    if (!mapRef.current) {
      // 지도 생성
      const map = new kakao.maps.Map(mapContainerRef.current, {
        center,
        level: 4,
      });
      mapRef.current = map;

      // 마커 생성
      const marker = new kakao.maps.Marker({
        position: center,
        map,
      });
      markerRef.current = marker;

      // 인포윈도우 생성
      const infoWindow = new kakao.maps.InfoWindow({
        content: buildInfoContent(siteName, infoContent),
        removable: true,
      });
      infoWindow.open(map, marker);
      infoWindowRef.current = infoWindow;

      // 마커 클릭 시 인포윈도우 토글
      kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(map, marker);
      });
    } else {
      // 지도 업데이트
      mapRef.current.setCenter(center);
      if (markerRef.current) {
        markerRef.current.setPosition(center);
      }
      if (infoWindowRef.current && markerRef.current) {
        infoWindowRef.current.setContent(buildInfoContent(siteName, infoContent));
        infoWindowRef.current.open(mapRef.current, markerRef.current);
      }
    }
  }, [sdkReady, lat, lng, siteName, infoContent]);

  // 컨테이너 크기 변경 시 relayout
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.relayout();
    }, 100);
    return () => clearTimeout(timer);
  }, [sdkReady]);

  // API 키 미설정 또는 위치 미선택 시 플레이스홀더
  if (!hasKakaoMapKey() || !lat || !lng) {
    return (
      <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-slate-700/50">
        <img
          src={HERO_IMAGE}
          alt="Hotel placeholder"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-slate-900/40 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium">
              {!hasKakaoMapKey()
                ? '카카오맵 API 키를 설정하면 지도를 볼 수 있습니다'
                : '주소를 검색하면 지도에 위치가 표시됩니다'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-slate-700/50">
      <div ref={mapContainerRef} className="w-full h-full" />
      {!sdkReady && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-300">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">지도 로딩 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function buildInfoContent(siteName?: string, extraContent?: string): string {
  const name = siteName || '선택된 위치';
  const extra = extraContent || '';
  return `
    <div style="
      padding: 12px 16px;
      background: rgba(30, 41, 59, 0.95);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 10px;
      color: #e2e8f0;
      font-size: 13px;
      min-width: 160px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    ">
      <div style="font-weight: 700; color: #60a5fa; margin-bottom: 4px; font-size: 14px;">
        📍 ${name}
      </div>
      ${extra ? `<div style="color: #94a3b8; font-size: 12px; line-height: 1.5;">${extra}</div>` : ''}
    </div>
  `;
}