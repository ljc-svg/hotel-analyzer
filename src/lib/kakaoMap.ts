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

// 카카오맵 JavaScript API 키 (직접 설정)
const KAKAO_MAP_API_KEY = '99f0af6a6e5f3b3179a59ba5b15c912a';

// SDK 로딩 상태 관리
let sdkLoadPromise: Promise<boolean> | null = null;

/**
 * 카카오맵 SDK를 동적으로 로드합니다.
 */
export function loadKakaoMapSDK(): Promise<boolean> {
  if (sdkLoadPromise) return sdkLoadPromise;

  // 이미 로드된 경우
  if (window.kakao && window.kakao.maps) {
    sdkLoadPromise = new Promise<boolean>((resolve) => {
      window.kakao.maps.load(() => {
        resolve(true);
      });
    });
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          resolve(true);
        });
      } else {
        resolve(false);
      }
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
          region: normalizeRegion(item.address.region_1depth_name),
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
 * 17개 시·도 기준: 서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주
 */
export function normalizeRegion(region1: string): string {
  const REGION_MAP: Record<string, string> = {
    '서울특별시': '서울',
    '서울': '서울',
    '부산광역시': '부산',
    '부산': '부산',
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
    '세종특별자치시': '세종',
    '세종': '세종',
    '경기도': '경기',
    '경기': '경기',
    '강원도': '강원',
    '강원특별자치도': '강원',
    '강원': '강원',
    '충청북도': '충북',
    '충북': '충북',
    '충청남도': '충남',
    '충남': '충남',
    '전라북도': '전북',
    '전북특별자치도': '전북',
    '전북': '전북',
    '전라남도': '전남',
    '전남': '전남',
    '경상북도': '경북',
    '경북': '경북',
    '경상남도': '경남',
    '경남': '경남',
    '제주특별자치도': '제주',
    '제주': '제주',
  };

  if (REGION_MAP[region1]) return REGION_MAP[region1];

  // 매칭 실패 시 기본값 (서울)
  return '서울';
}

/**
 * API 키가 설정되어 있는지 확인합니다.
 */
export function hasKakaoMapKey(): boolean {
  return !!KAKAO_MAP_API_KEY;
}
