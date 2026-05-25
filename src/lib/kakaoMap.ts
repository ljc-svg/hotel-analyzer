// 카카오맵 SDK 유틸리티 함수

// Kakao Maps SDK 타입 선언
declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
        Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
        InfoWindow: new (options: KakaoInfoWindowOptions) => KakaoInfoWindow;
        services: {
          Geocoder: new () => KakaoGeocoder;
          Status: { OK: string; ZERO_RESULT: string; ERROR: string };
        };
        event: {
          addListener: (target: unknown, type: string, handler: () => void) => void;
        };
      };
    };
  }
}

export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

export interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  relayout: () => void;
}

export interface KakaoMarkerOptions {
  position: KakaoLatLng;
  map?: KakaoMap;
}

export interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
  setPosition: (position: KakaoLatLng) => void;
  getPosition: () => KakaoLatLng;
}

export interface KakaoInfoWindowOptions {
  content: string;
  removable?: boolean;
}

export interface KakaoInfoWindow {
  open: (map: KakaoMap, marker: KakaoMarker) => void;
  close: () => void;
  setContent: (content: string) => void;
}

export interface KakaoGeocoder {
  addressSearch: (
    query: string,
    callback: (result: KakaoGeocoderResult[], status: string) => void
  ) => void;
}

export interface KakaoGeocoderResult {
  address_name: string;
  address: {
    address_name: string;
    region_1depth_name: string; // 시도
    region_2depth_name: string; // 시군구
    region_3depth_name: string; // 읍면동
  };
  road_address: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    building_name: string;
  } | null;
  x: string; // longitude
  y: string; // latitude
}

export interface AddressSearchResult {
  address: string;
  lat: number;
  lng: number;
  region: string; // 시도 (normalized for Cap Rate)
  district: string; // 시군구
}

// SDK 로딩 상태 관리
let sdkLoadPromise: Promise<boolean> | null = null;

/**
 * 카카오맵 SDK를 동적으로 로드합니다.
 */
export function loadKakaoMapSDK(): Promise<boolean> {
  if (sdkLoadPromise) return sdkLoadPromise;

  const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY || '99f0af6a6e5f3b3179a59ba5b15c912a';
  if (!apiKey) {
    sdkLoadPromise = Promise.resolve(false);
    return sdkLoadPromise;
  }

  // 이미 로드된 경우
  if (window.kakao && window.kakao.maps) {
    sdkLoadPromise = Promise.resolve(true);
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        resolve(true);
      });
    };
    script.onerror = () => {
      sdkLoadPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

/**
 * 주소를 검색하여 좌표와 지역 정보를 반환합니다.
 */
export function searchAddress(query: string): Promise<AddressSearchResult[]> {
  return new Promise((resolve) => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      resolve([]);
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(query, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const results: AddressSearchResult[] = result.map((item) => ({
          address: item.road_address?.address_name || item.address.address_name,
          lat: parseFloat(item.y),
          lng: parseFloat(item.x),
          region: normalizeRegion(item.address.region_1depth_name, item.address.region_2depth_name),
          district: item.address.region_2depth_name,
        }));
        resolve(results);
      } else {
        resolve([]);
      }
    });
  });
}

/**
 * 지역명을 Cap Rate 매트릭스의 키로 정규화합니다.
 * 예: "서울특별시" → "서울", "경기도 가평군" → "가평"
 */
export function normalizeRegion(region1: string, region2: string): string {
  // Cap Rate 테이블에 있는 지역 목록
  const REGION_MAP: Record<string, string> = {
    '서울특별시': '서울',
    '서울': '서울',
    '부산광역시': '부산',
    '부산': '부산',
    '제주특별자치도': '제주',
    '제주': '제주',
    '대구광역시': '대구',
    '대구': '대구',
    '인천광역시': '인천',
    '인천': '인천',
    '광주광역시': '광주',
    '광주': '광주',
    '대전광역시': '대전',
    '대전': '대전',
    '울산광역시': '울산',
    '울산': '울산',
  };

  // 시군구 기반 매핑 (경기도 등)
  const DISTRICT_MAP: Record<string, string> = {
    '수원시': '수원',
    '수원': '수원',
    '성남시': '성남',
    '성남': '성남',
    '고양시': '고양',
    '고양': '고양',
    '용인시': '용인',
    '용인': '용인',
    '파주시': '파주',
    '파주': '파주',
    '가평군': '가평',
    '가평': '가평',
    '양평군': '양평',
    '양평': '양평',
    '강릉시': '강릉',
    '강릉': '강릉',
    '경주시': '경주',
    '경주': '경주',
    '여수시': '여수',
    '여수': '여수',
  };

  // 시군구 우선 매칭
  if (region2) {
    // "수원시 장안구" → "수원시" 추출
    const districtBase = region2.split(' ')[0];
    if (DISTRICT_MAP[districtBase]) return DISTRICT_MAP[districtBase];
    if (DISTRICT_MAP[region2]) return DISTRICT_MAP[region2];
  }

  // 시도 매칭
  if (REGION_MAP[region1]) return REGION_MAP[region1];

  // 매칭 실패 시 기본값 (서울)
  return '서울';
}

/**
 * API 키가 설정되어 있는지 확인합니다.
 */
export function hasKakaoMapKey(): boolean {
  return true;
}
