import { useState } from 'react';
import { Button } from '@/components/ui/button';
import InputWizard from '@/components/InputWizard';
import ResultsDashboard from '@/components/ResultsDashboard';
import Charts from '@/components/Charts';
import KakaoMapView from '@/components/KakaoMapView';
import { calculate } from '@/lib/calculator';
import type { HotelInput, CalculationResult } from '@/lib/types';
import type { AddressSearchResult } from '@/lib/kakaoMap';

const HERO_IMAGE = 'https://mgx-backend-cdn.metadl.com/generate/images/1264998/2026-05-24/pgarb7iaagsa/hero-hotel-analytics-dashboard.png';

interface SelectedLocation {
  lat: number;
  lng: number;
  address: string;
  region: string;
  district: string;
}

export default function Index() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [location, setLocation] = useState<SelectedLocation | null>(null);

  const handleCalculate = (input: HotelInput) => {
    const calcResult = calculate(input);
    setResult(calcResult);
  };

  const handleReset = () => {
    setResult(null);
  };

  const handleAddressSelect = (addressResult: AddressSearchResult) => {
    setLocation({
      lat: addressResult.lat,
      lng: addressResult.lng,
      address: addressResult.address,
      region: addressResult.region,
      district: addressResult.district,
    });
  };

  // 인포윈도우 내용 생성
  const getInfoContent = (): string => {
    if (!result) return '';
    const noi = result.monthlyNOI.toLocaleString();
    const margin = result.noiMargin.toFixed(1);
    return `월 NOI: ₩${noi}<br/>수익률: ${margin}%`;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Hero Section - Compact */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Hotel Analytics Dashboard"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/60 via-[#0f172a]/80 to-[#0f172a]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 md:py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 mb-4">
            <span className="text-blue-400 text-sm font-medium">AI 기반 분석 엔진 v7.10</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              AI 호텔 수지분석기
            </span>
          </h1>
          <p className="text-base text-slate-400 max-w-2xl mx-auto">
            10개 매트릭스 기반 호텔/숙박업 사업성 자동 분석 · 마스터리스 & 매수 판정
          </p>
          {result && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              ← 다시 분석하기
            </Button>
          )}
        </div>
      </header>

      {/* Main Content - Split Panel Layout */}
      <main className="max-w-7xl mx-auto px-4 pb-20">
        {!result ? (
          <div className="flex flex-col lg:flex-row gap-6 py-6">
            {/* Left Panel - Input Wizard */}
            <div className="w-full lg:w-2/5">
              <InputWizard onCalculate={handleCalculate} onAddressSelect={handleAddressSelect} />
            </div>

            {/* Right Panel - Map */}
            <div className="w-full lg:w-3/5">
              <div className="sticky top-6 space-y-4">
                {/* 지도 */}
                <div className="rounded-xl overflow-hidden">
                  <KakaoMapView
                    lat={location?.lat}
                    lng={location?.lng}
                    siteName={location?.address}
                  />
                </div>

                {/* 선택된 위치 정보 */}
                {location && (
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl">
                    <h3 className="text-sm font-semibold text-blue-400 mb-2">📍 선택된 위치</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400">주소</span>
                        <p className="text-white font-medium truncate">{location.address}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">지역 (Cap Rate 기준)</span>
                        <p className="text-white font-medium">{location.region}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">위도</span>
                        <p className="text-slate-300">{location.lat.toFixed(6)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">경도</span>
                        <p className="text-slate-300">{location.lng.toFixed(6)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 py-6">
            {/* Left Panel - Map (smaller when results shown) */}
            <div className="w-full lg:w-2/5 space-y-4">
              <div className="rounded-xl overflow-hidden">
                <KakaoMapView
                  lat={location?.lat}
                  lng={location?.lng}
                  siteName={location?.address}
                  infoContent={getInfoContent()}
                />
              </div>
              {location && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl">
                  <h3 className="text-sm font-semibold text-blue-400 mb-2">📍 분석 위치</h3>
                  <p className="text-white text-sm">{location.address}</p>
                  <p className="text-slate-400 text-xs mt-1">{location.region} · {location.district}</p>
                </div>
              )}
            </div>

            {/* Right Panel - Results */}
            <div className="w-full lg:w-3/5 space-y-8">
              <ResultsDashboard result={result} />
              <Charts result={result} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            AI 호텔 수지분석기 · 마스터프롬프트 v1.0 기반 · 10개 매트릭스 자동 산정
          </p>
        </div>
      </footer>
    </div>
  );
}