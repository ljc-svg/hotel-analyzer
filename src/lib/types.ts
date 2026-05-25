// 호텔 수지분석기 타입 정의

export type ADRGrade = 'A' | 'B' | 'C';
export type FacilityType = '모텔' | '호텔';
export type OperationMode = '마스터리스' | '매수';
export type LeaseJudgment = 'GO' | 'HOLD' | 'REJECT';
export type PurchaseJudgment = 'BUY' | 'WATCH' | 'AVOID';

export interface HotelInput {
  // Step 1: 사이트 기본 정보
  hotelName: string;
  region: string;
  facilityType: FacilityType;
  totalRooms: number;
  totalArea: number; // 평
  floors: number;
  elevators: number;
  contractPower: number; // kW (0이면 자동 산정)

  // Step 2: 매출 변수
  adr: number; // 평균 객실 단가
  occupancyRate: number; // 가동률 (0~1)
  businessDays: number; // 월 영업일수
  fnbUnitPrice: number; // F&B 단가
  amenityUnitPrice: number; // 어메니티 단가

  // Step 3: 운영 변수
  operationMode: OperationMode;
  frontXCount: number; // 프론트 인원
  adrGrade: ADRGrade; // A/B/C 등급
  operationGrade: ADRGrade; // 운영 등급 (A/B/C)
  brandGrade: ADRGrade; // 브랜드 등급 (A/B/C)
  hasFrontX: boolean; // 프론트X 시스템 사용 여부
  hasFnb: boolean; // F&B 운영 여부
  hasAmenity: boolean; // 어메니티 운영 여부
  jacuzziRooms: number; // 자쿠지 객실 수

  // Step 4: 거래 조건
  // 마스터리스 조건
  monthlyRent: number; // 월 임대료
  deposit: number; // 보증금
  leaseTerm: number; // 계약 기간 (년)
  rentIncreaseRate: number; // 연 임대료 인상률
  tiAmount: number; // TI (Tenant Improvement) 월 상각액

  // 매수 조건
  purchasePrice: number; // 매입가
  loanAmount: number; // 대출금
  loanRate: number; // 대출 이자율
  loanTerm: number; // 대출 기간 (년)
}

export interface CostBreakdown {
  labor: number;
  electricity: number;
  gas: number;
  water: number;
  supplies: number;
  marketing: number;
  fixedCosts: number;
  otaCommission: number;
  cardFee: number;
  rent: number; // 마스터리스 시
  loanPayment: number; // 매수 시
  total: number;
}

export interface RevenueBreakdown {
  roomRevenue: number;
  fnbRevenue: number;
  amenityRevenue: number;
  total: number;
}

export interface LeaseEvaluation {
  rentToRevenueRatio: number; // 임대료/매출 비율
  noiAfterRent: number; // 임대료 차감 후 NOI
  breakEvenOcc: number; // 손익분기 가동률
  rentIncreaseImpact: number; // 임대료 인상 후 3년차 NOI
  conditions: { label: string; passed: boolean; value: string }[];
  judgment: LeaseJudgment;
}

export interface PurchaseEvaluation {
  properPrice: number; // 적정가격 (NOI / Cap Rate)
  priceGap: number; // 매입가 - 적정가
  cashOnCashROI: number; // Cash-on-Cash ROI
  dscr: number; // DSCR
  paybackYears: number; // 투자 회수 기간
  judgment: PurchaseJudgment;
}

export interface MonthlyPnL {
  month: number;
  monthName: string;
  revenue: number;
  costs: number;
  noi: number;
  seasonalCoeff: number;
}

export interface CalculationResult {
  revenue: RevenueBreakdown;
  costs: CostBreakdown;
  monthlyNOI: number;
  annualNOI: number;
  noiMargin: number; // %
  monthlyPnL: MonthlyPnL[];
  leaseEvaluation?: LeaseEvaluation;
  purchaseEvaluation?: PurchaseEvaluation;
  costDetails: { category: string; amount: number; percentage: number }[];
}

export const DEFAULT_INPUT: HotelInput = {
  hotelName: '',
  region: '서울',
  facilityType: '호텔',
  totalRooms: 50,
  totalArea: 500,
  floors: 5,
  elevators: 1,
  contractPower: 0,
  adr: 100000,
  occupancyRate: 0.65,
  businessDays: 30,
  fnbUnitPrice: 15000,
  amenityUnitPrice: 5000,
  operationMode: '마스터리스',
  frontXCount: 2,
  adrGrade: 'B',
  operationGrade: 'B',
  brandGrade: 'B',
  hasFrontX: false,
  hasFnb: false,
  hasAmenity: false,
  jacuzziRooms: 0,
  monthlyRent: 10000000,
  deposit: 100000000,
  leaseTerm: 5,
  rentIncreaseRate: 0.03,
  tiAmount: 0,
  purchasePrice: 5000000000,
  loanAmount: 3000000000,
  loanRate: 0.045,
  loanTerm: 20,
};

export const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];