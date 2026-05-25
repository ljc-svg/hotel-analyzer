import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { loadKakaoMapSDK, searchAddress, hasKakaoMapKey } from '@/lib/kakaoMap';
import type { AddressSearchResult } from '@/lib/kakaoMap';

interface KakaoAddressSearchProps {
  onSelect: (result: AddressSearchResult) => void;
}

export default function KakaoAddressSearch({ onSelect }: KakaoAddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // SDK 로드
  useEffect(() => {
    if (!hasKakaoMapKey()) return;
    loadKakaoMapSDK().then((loaded) => {
      setSdkReady(loaded);
    });
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setShowDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      const searchResults = await searchAddress(value);
      setResults(searchResults);
      setIsLoading(false);
    }, 300);
  }, []);

  const handleSelect = (result: AddressSearchResult) => {
    setSelectedAddress(result.address);
    setQuery(result.address);
    setShowDropdown(false);
    setResults([]);
    onSelect(result);
  };

  // API 키 미설정 시
  if (!hasKakaoMapKey()) {
    return (
      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <p className="text-yellow-400 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>카카오맵 API 키를 설정해주세요 (.env 파일에 VITE_KAKAO_MAP_KEY)</span>
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="주소 검색 (예: 해운대구 중동)"
          className="pl-9 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 선택된 주소 표시 */}
      {selectedAddress && !showDropdown && (
        <p className="mt-1 text-xs text-blue-400 flex items-center gap-1">
          <span>📍</span> {selectedAddress}
        </p>
      )}

      {/* 검색 결과 드롭다운 */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg bg-slate-800 border border-slate-600 shadow-xl">
          {results.map((result, idx) => (
            <button
              key={`${result.address}-${idx}`}
              onClick={() => handleSelect(result)}
              className="w-full px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700/80 transition-colors border-b border-slate-700/50 last:border-b-0 flex items-start gap-2"
            >
              <span className="text-blue-400 mt-0.5 shrink-0">📍</span>
              <div>
                <p className="text-white">{result.address}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {result.region} · {result.district}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {showDropdown && query.length >= 2 && !isLoading && results.length === 0 && sdkReady && (
        <div className="absolute z-50 w-full mt-1 p-3 rounded-lg bg-slate-800 border border-slate-600">
          <p className="text-sm text-slate-400 text-center">검색 결과가 없습니다</p>
        </div>
      )}

      {/* SDK 로딩 중 */}
      {!sdkReady && (
        <p className="mt-1 text-xs text-slate-500">카카오맵 SDK 로딩 중...</p>
      )}
    </div>
  );
}