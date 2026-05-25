import type {
  HotelInput,
  CalculationResult,
  ADRGrade,
  RevenueBreakdown,
  CostBreakdown,
  MonthlyPnL,
  LeaseEvaluation,
  PurchaseEvaluation,
  LeaseJudgment,
  PurchaseJudgment,
} from './types';

// ═══════════════════════════════════════════════════════════════
// Matrix 1: ADR Grade Mapping
// ═══════════════════════════════════════════════════════════════
export function getADRGrade(adr: number): ADRGrade {
  if (adr >= 200000) return 'A';
  if (adr >= 100000) return 'B';
  return 'C';
}

// ═══════════════════════════════════════════════════════════════
// Matrix 2: Cap Rate by Region × Facility Type (17 시·도)
// ═══════════════════════════════════════════════════════════════
const CAP_RATE_TABLE: Record<string, Record<string, number>> = {
  '서울': { '호텔': 0.060, '모텔': 0.070 },
  '부산': { '호텔': 0.065, '모텔': 0.075 },
  '대구': { '호텔': 0.0675, '모텔': 0.0775 },
  '인천': { '호텔': 0.065, '모텔': 0.075 },
  '광주': { '호텔': 0.0675, '모텔': 0.0775 },
  '대전': { '호텔': 0.0675, '모텔': 0.0775 },
  '울산': { '호텔': 0.0675, '모텔': 0.0775 },
  '세종': { '호텔': 0.0675, '모텔': 0.0775 },
  '경기': { '호텔': 0.065, '모텔': 0.075 },
  '강원': { '호텔': 0.075, '모텔': 0.085 },
  '충북': { '호텔': 0.080, '모텔': 0.090 },
  '충남': { '호텔': 0.080, '모텔': 0.090 },
  '전북': { '호텔': 0.085, '모텔': 0.095 },
  '전남': { '호텔': 0.085, '모텔': 0.095 },
  '경북': { '호텔': 0.080, '모텔': 0.090 },
  '경남': { '호텔': 0.080, '모텔': 0.090 },
  '제주': { '호텔': 0.070, '모텔': 0.080 },
};

export function getCapRate(region: string, facilityType: string): number {
  return CAP_RATE_TABLE[region]?.[facilityType] ?? 0.07;
}

// ═══════════════════════════════════════════════════════════════
// Matrix 3: Labor Cost (10 positions)
// ═══════════════════════════════════════════════════════════════
interface StaffPosition {
  title: string;
  baseSalary: number;
  getCount: (input: HotelInput) => number;
}

const STAFF_POSITIONS: StaffPosition[] = [
  {
    title: '지배인',
    baseSalary: 5000000,
    getCount: (input) => (input.totalRooms >= 80 && input.operationGrade === 'A' && input.brandGrade === 'A') ? 1 : 0,
  },
  {
    title: '지점매니저',
    baseSalary: 3000000,
    getCount: () => 1,
  },
  {
    title: '프론트',
    baseSalary: 3000000,
    getCount: (input) => {
      let count: number;
      if (input.totalRooms <= 30) count = 1;
      else if (input.totalRooms <= 60) count = 2;
      else count = 3;
      // hasFrontX 시스템 사용 시 -1
      if (input.hasFrontX && count > 1) count -= 1;
      return count;
    },
  },
  {
    title: '인스펙터',
    baseSalary: 3000000,
    getCount: (input) => {
      if (input.totalRooms <= 30) return 1;
      if (input.totalRooms <= 60) return 2;
      return 3;
    },
  },
  {
    title: '인스펙터 어시',
    baseSalary: 2200000,
    getCount: (input) => (input.totalRooms >= 31 && input.totalRooms <= 60) ? 1 : 0,
  },
  {
    title: '컨시어지',
    baseSalary: 3000000,
    getCount: (input) => (input.totalRooms >= 80 && input.hasFrontX) ? 1 : 0,
  },
  {
    title: '하우스맨',
    baseSalary: 3000000,
    getCount: (input) => (input.totalRooms >= 40) ? 1 : 0,
  },
  {
    title: '기계방제소장',
    baseSalary: 4000000,
    getCount: (input) => (input.totalRooms >= 80) ? 1 : 0,
  },
  {
    title: 'F&B 직원',
    baseSalary: 2800000,
    getCount: (input) => input.hasFnb ? 1 : 0,
  },
  {
    title: '부대시설 직원',
    baseSalary: 2500000,
    getCount: (input) => input.hasAmenity ? 1 : 0,
  },
];

const SOCIAL_INSURANCE_RATE = 0.1913; // 4대보험 사업주 부담률

export function calculateLaborCost(input: HotelInput): { totalLabor: number; staffCount: number } {
  let totalLabor = 0;
  let staffCount = 0;
  for (const pos of STAFF_POSITIONS) {
    const count = pos.getCount(input);
    staffCount += count;
    totalLabor += pos.baseSalary * count;
  }
  // 4대보험 추가
  totalLabor *= (1 + SOCIAL_INSURANCE_RATE);
  return { totalLabor: Math.round(totalLabor), staffCount };
}

// ═══════════════════════════════════════════════════════════════
// Matrix 4: Contract Power Estimation
// ═══════════════════════════════════════════════════════════════
export function estimateContractPower(rooms: number, floors: number, elevators: number): number {
  const roomPower = rooms * 3;
  const commonPower = floors * 5;
  const elevatorPower = elevators * 15;
  return roomPower + commonPower + elevatorPower;
}

// ═══════════════════════════════════════════════════════════════
// Matrix 5: KEPCO Electricity Rate
// ═══════════════════════════════════════════════════════════════
const KEPCO_BASE_RATE = 47490; // ₩/kW/월 (기본요금 기준 단가)

// 월별 전기 계절 계수 (normalized, avg=1.0)
const ELECTRIC_SEASONAL_COEFF = [
  1.11, 1.06, 0.78, 0.74, 0.78, 1.11,
  1.43, 1.43, 0.92, 0.78, 0.83, 1.02,
];

export function calculateElectricity(contractPower: number, month: number): number {
  const coeff = ELECTRIC_SEASONAL_COEFF[month] ?? 1.0;
  return Math.round(KEPCO_BASE_RATE * contractPower / 1000 * coeff);
}

export function calculateMonthlyElectricity(contractPower: number): number {
  const annual = ELECTRIC_SEASONAL_COEFF.reduce((sum, c) => sum + KEPCO_BASE_RATE * contractPower / 1000 * c, 0);
  return Math.round(annual / 12);
}

// ═══════════════════════════════════════════════════════════════
// Matrix 6: City Gas Rate by ADR Grade
// ═══════════════════════════════════════════════════════════════
const GAS_PER_ROOM_BY_GRADE: Record<ADRGrade, number> = {
  'A': 139000,
  'B': 94000,
  'C': 44000,
};

// 월별 가스 계절 계수 (normalized, avg=1.0)
const GAS_SEASONAL_COEFF = [
  2.00, 1.89, 1.33, 0.78, 0.56, 0.33,
  0.22, 0.22, 0.56, 0.78, 1.44, 1.89,
];

export function calculateGas(rooms: number, grade: ADRGrade, occ: number, month: number): number {
  const baseRate = GAS_PER_ROOM_BY_GRADE[grade];
  const coeff = GAS_SEASONAL_COEFF[month] ?? 1.0;
  return Math.round(baseRate * rooms * occ * coeff);
}

export function calculateMonthlyGas(rooms: number, grade: ADRGrade, occ: number): number {
  const annual = GAS_SEASONAL_COEFF.reduce((sum, c) => sum + GAS_PER_ROOM_BY_GRADE[grade] * rooms * occ * c, 0);
  return Math.round(annual / 12);
}

// ═══════════════════════════════════════════════════════════════
// Matrix 7: 12-Month Seasonal Revenue Coefficients
// ═══════════════════════════════════════════════════════════════
const REVENUE_SEASONAL_COEFF = [
  0.80, 0.75, 0.85, 0.90, 1.00, 1.05,
  1.20, 1.25, 1.05, 1.00, 0.90, 0.85,
];

// ═══════════════════════════════════════════════════════════════
// Matrix 8: ABC Grade Unit Costs
// ═══════════════════════════════════════════════════════════════
interface UnitCostItem {
  name: string;
  category: string;
  getAmount: (input: HotelInput, revenue: number, staffCount: number) => number;
}

const UNIT_COSTS: UnitCostItem[] = [
  // 일반 소모품 (객실당)
  { name: '객실 소모품', category: '소모품', getAmount: (i) => {
    const rates: Record<ADRGrade, number> = { A: 8000, B: 5500, C: 3500 };
    return rates[i.adrGrade] * i.totalRooms * i.occupancyRate * i.businessDays;
  }},
  { name: '시설 소모품', category: '소모품', getAmount: (i) => {
    const rates: Record<ADRGrade, number> = { A: 15000, B: 10000, C: 5500 };
    return rates[i.adrGrade] * i.totalRooms;
  }},
  { name: '어메니티', category: '소모품', getAmount: (i) => {
    if (!i.hasAmenity) return 0;
    const rates: Record<ADRGrade, number> = { A: 2500, B: 2000, C: 1500 };
    return rates[i.adrGrade] * i.totalRooms * i.occupancyRate * i.businessDays;
  }},
  { name: '린넨/세탁', category: '소모품', getAmount: (i) => {
    const rates: Record<ADRGrade, number> = { A: 12000, B: 8000, C: 5000 };
    return rates[i.adrGrade] * i.totalRooms * i.occupancyRate * i.businessDays;
  }},
  // 수도
  { name: '수도료', category: '유틸리티', getAmount: (i) => {
    const basePerRoom = 35000;
    const jacuzziExtra = i.jacuzziRooms * 25000;
    return basePerRoom * i.totalRooms * i.occupancyRate + jacuzziExtra;
  }},
  // 인터넷/OTT
  { name: '인터넷', category: '고정비', getAmount: (i) => {
    return i.totalRooms <= 30 ? 150000 : i.totalRooms <= 60 ? 250000 : 400000;
  }},
  { name: 'OTT/IPTV', category: '고정비', getAmount: (i) => {
    return i.totalRooms * 5000;
  }},
  // 보험
  { name: '화재보험', category: '고정비', getAmount: (i) => Math.round(i.totalArea * 500) },
  // 세무/회계
  { name: '세무/회계', category: '고정비', getAmount: () => 500000 },
  // OTA 광고 (per-room basis)
  { name: 'OTA 광고비 (야놀자)', category: '마케팅', getAmount: (i) => {
    return 31000 * i.totalRooms;
  }},
  { name: 'OTA 광고비 (여기어때)', category: '마케팅', getAmount: (i) => {
    return 17000 * i.totalRooms;
  }},
  // 매출 비례 항목
  { name: 'OTA 수수료 (15.3%)', category: '마케팅', getAmount: (_, rev) => Math.round(rev * 0.153) },
  { name: '카드수수료 (0.25%)', category: '마케팅', getAmount: (_, rev) => Math.round(rev * 0.0025) },
  // 고정 안전/관리비
  { name: '소방안전관리', category: '고정비', getAmount: () => 300000 },
  { name: '승강기 유지보수', category: '고정비', getAmount: (i) => i.elevators * 200000 },
  { name: '전기안전관리', category: '고정비', getAmount: () => 250000 },
  { name: '방역/해충', category: '고정비', getAmount: (i) => i.totalRooms <= 30 ? 150000 : 250000 },
  // 종량제봉투
  { name: '종량제봉투', category: '소모품', getAmount: (i) => {
    const rates: Record<ADRGrade, number> = { A: 3500, B: 2500, C: 2000 };
    return rates[i.adrGrade] * i.totalRooms;
  }},
  // 국선전화
  { name: '국선전화', category: '고정비', getAmount: (i) => 1000 * i.totalRooms },
  // 업무용 휴대폰
  { name: '업무용 휴대폰', category: '고정비', getAmount: (i) => 2000 * i.totalRooms },
  // 직원식대
  { name: '직원식대', category: '인건비부대', getAmount: (_, _rev, staffCount) => staffCount * 300000 },
  // 직원후생비
  { name: '직원후생비', category: '인건비부대', getAmount: (_, _rev, staffCount) => staffCount * 100000 },
];

// ═══════════════════════════════════════════════════════════════
// Matrix 9: Master Lease Evaluation (4 conditions)
// ═══════════════════════════════════════════════════════════════
function evaluateLease(input: HotelInput, monthlyRevenue: number, monthlyNOIBeforeRent: number): LeaseEvaluation {
  const rentRatio = input.monthlyRent / monthlyRevenue;
  const noiAfterRent = monthlyNOIBeforeRent - input.monthlyRent;
  const limitRent = monthlyRevenue * 0.26; // 한계 임대료
  const breakEvenOcc = input.monthlyRent / (input.adr * input.totalRooms * input.businessDays);

  // TI 반영 후 실질 월세
  const effectiveRent = input.tiAmount > 0 ? input.monthlyRent - input.tiAmount : input.monthlyRent;

  // 3년차 임대료 인상 후 NOI (for display)
  const rent3yr = input.monthlyRent * Math.pow(1 + input.rentIncreaseRate, 2);
  const noi3yr = monthlyNOIBeforeRent - rent3yr;

  const conditions: { label: string; passed: boolean; value: string }[] = [
    {
      label: '조건1: NOI > 0 (월세 차감 후)',
      passed: noiAfterRent > 0,
      value: `₩${Math.round(noiAfterRent).toLocaleString()}`,
    },
    {
      label: '조건2: 월세 ≤ 매출 × 26% (한계 임대료)',
      passed: input.monthlyRent <= limitRent,
      value: `월세 ${(rentRatio * 100).toFixed(1)}% (한계 26%)`,
    },
    {
      label: '조건3: 보증금 ≤ 월세 × 12',
      passed: input.deposit <= input.monthlyRent * 12,
      value: `보증금 ₩${input.deposit.toLocaleString()} / 기준 ₩${(input.monthlyRent * 12).toLocaleString()}`,
    },
    {
      label: '조건4: TI 반영 후 월세 ≤ 한계 임대료',
      passed: effectiveRent <= limitRent,
      value: `실질월세 ₩${Math.round(effectiveRent).toLocaleString()} / 한계 ₩${Math.round(limitRent).toLocaleString()}`,
    },
  ];

  const passCount = conditions.filter(c => c.passed).length;
  let judgment: LeaseJudgment;
  if (passCount === 4) judgment = 'GO';
  else if (passCount === 3) judgment = 'HOLD';
  else judgment = 'REJECT';

  return { rentToRevenueRatio: rentRatio, noiAfterRent, breakEvenOcc, rentIncreaseImpact: noi3yr, conditions, judgment };
}

// ═══════════════════════════════════════════════════════════════
// Matrix 10: Purchase Evaluation
// ═══════════════════════════════════════════════════════════════
function evaluatePurchase(input: HotelInput, annualNOI: number, capRate: number): PurchaseEvaluation {
  const properPrice = annualNOI / capRate;
  const priceGap = input.purchasePrice - properPrice;

  const equity = input.purchasePrice - input.loanAmount;
  const annualDebtService = input.loanAmount > 0
    ? input.loanAmount * (input.loanRate / (1 - Math.pow(1 + input.loanRate, -input.loanTerm)))
    : 0;
  const cashFlow = annualNOI - annualDebtService;
  const cashOnCashROI = equity > 0 ? cashFlow / equity : 0;
  const dscr = annualDebtService > 0 ? annualNOI / annualDebtService : 999;
  const paybackYears = cashFlow > 0 ? equity / cashFlow : 99;

  let judgment: PurchaseJudgment;
  if (priceGap <= 0 && cashOnCashROI >= 0.08 && dscr >= 1.3) {
    judgment = 'BUY';
  } else if (priceGap <= properPrice * 0.1 && dscr >= 1.0) {
    judgment = 'WATCH';
  } else {
    judgment = 'AVOID';
  }

  return { properPrice, priceGap, cashOnCashROI, dscr, paybackYears, judgment };
}

// ═══════════════════════════════════════════════════════════════
// Main Calculate Function
// ═══════════════════════════════════════════════════════════════
export function calculate(input: HotelInput): CalculationResult {
  // Contract power
  const contractPower = input.contractPower > 0
    ? input.contractPower
    : estimateContractPower(input.totalRooms, input.floors, input.elevators);

  // Revenue
  const roomRevenue = input.adr * input.totalRooms * input.occupancyRate * input.businessDays;
  const fnbRevenue = input.hasFnb ? input.fnbUnitPrice * input.totalRooms * input.occupancyRate * input.businessDays * 0.3 : 0;
  const amenityRevenue = input.hasAmenity ? input.amenityUnitPrice * input.totalRooms * input.occupancyRate * input.businessDays * 0.2 : 0;
  const totalRevenue = roomRevenue + fnbRevenue + amenityRevenue;

  const revenue: RevenueBreakdown = {
    roomRevenue: Math.round(roomRevenue),
    fnbRevenue: Math.round(fnbRevenue),
    amenityRevenue: Math.round(amenityRevenue),
    total: Math.round(totalRevenue),
  };

  // Labor
  const { totalLabor: labor, staffCount } = calculateLaborCost(input);
  const electricity = calculateMonthlyElectricity(contractPower);
  const gas = calculateMonthlyGas(input.totalRooms, input.adrGrade, input.occupancyRate);

  // Unit costs from Matrix 8
  let suppliesTotal = 0;
  let marketingTotal = 0;
  let fixedTotal = 0;
  let waterTotal = 0;
  let laborExtrasTotal = 0;

  for (const item of UNIT_COSTS) {
    const amount = item.getAmount(input, totalRevenue, staffCount);
    switch (item.category) {
      case '소모품': suppliesTotal += amount; break;
      case '마케팅': marketingTotal += amount; break;
      case '고정비': fixedTotal += amount; break;
      case '유틸리티': waterTotal += amount; break;
      case '인건비부대': laborExtrasTotal += amount; break;
    }
  }

  const otaCommission = Math.round(totalRevenue * 0.153);
  const cardFee = Math.round(totalRevenue * 0.0025);

  // Rent or loan
  const rent = input.operationMode === '마스터리스' ? input.monthlyRent : 0;
  const annualDebtService = input.operationMode === '매수' && input.loanAmount > 0
    ? input.loanAmount * (input.loanRate / (1 - Math.pow(1 + input.loanRate, -input.loanTerm)))
    : 0;
  const monthlyLoanPayment = Math.round(annualDebtService / 12);

  const totalCosts = labor + laborExtrasTotal + electricity + gas + waterTotal + suppliesTotal + marketingTotal + fixedTotal + rent + monthlyLoanPayment;

  const costs: CostBreakdown = {
    labor: labor + laborExtrasTotal,
    electricity,
    gas,
    water: Math.round(waterTotal),
    supplies: Math.round(suppliesTotal),
    marketing: Math.round(marketingTotal),
    fixedCosts: Math.round(fixedTotal),
    otaCommission,
    cardFee,
    rent,
    loanPayment: monthlyLoanPayment,
    total: Math.round(totalCosts),
  };

  const monthlyNOI = Math.round(totalRevenue - totalCosts);
  const annualNOI = monthlyNOI * 12;
  const noiMargin = totalRevenue > 0 ? (monthlyNOI / totalRevenue) * 100 : 0;

  // Cost details for chart
  const costDetails = [
    { category: '인건비', amount: labor + laborExtrasTotal, percentage: ((labor + laborExtrasTotal) / totalCosts) * 100 },
    { category: '전기료', amount: electricity, percentage: (electricity / totalCosts) * 100 },
    { category: '가스', amount: gas, percentage: (gas / totalCosts) * 100 },
    { category: '수도', amount: Math.round(waterTotal), percentage: (waterTotal / totalCosts) * 100 },
    { category: '소모품', amount: Math.round(suppliesTotal), percentage: (suppliesTotal / totalCosts) * 100 },
    { category: '마케팅/수수료', amount: Math.round(marketingTotal), percentage: (marketingTotal / totalCosts) * 100 },
    { category: '고정비', amount: Math.round(fixedTotal), percentage: (fixedTotal / totalCosts) * 100 },
  ];

  if (rent > 0) costDetails.push({ category: '임대료', amount: rent, percentage: (rent / totalCosts) * 100 });
  if (monthlyLoanPayment > 0) costDetails.push({ category: '대출상환', amount: monthlyLoanPayment, percentage: (monthlyLoanPayment / totalCosts) * 100 });

  // Monthly P&L (12 months)
  const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const monthlyPnL: MonthlyPnL[] = MONTH_NAMES.map((name, idx) => {
    const revCoeff = REVENUE_SEASONAL_COEFF[idx];
    const mRevenue = Math.round(totalRevenue * revCoeff);
    const mElec = calculateElectricity(contractPower, idx);
    const mGas = calculateGas(input.totalRooms, input.adrGrade, input.occupancyRate, idx);
    const mCosts = Math.round(labor + laborExtrasTotal + mElec + mGas + waterTotal + suppliesTotal * revCoeff + marketingTotal * revCoeff + fixedTotal + rent + monthlyLoanPayment);
    return {
      month: idx + 1,
      monthName: name,
      revenue: mRevenue,
      costs: mCosts,
      noi: mRevenue - mCosts,
      seasonalCoeff: revCoeff,
    };
  });

  // Evaluations
  let leaseEvaluation: LeaseEvaluation | undefined;
  let purchaseEvaluation: PurchaseEvaluation | undefined;

  if (input.operationMode === '마스터리스') {
    leaseEvaluation = evaluateLease(input, totalRevenue, monthlyNOI + rent); // NOI before rent
  } else {
    const capRate = getCapRate(input.region, input.facilityType);
    purchaseEvaluation = evaluatePurchase(input, annualNOI + annualDebtService, capRate); // NOI before debt
  }

  return {
    revenue,
    costs,
    monthlyNOI,
    annualNOI,
    noiMargin,
    monthlyPnL,
    leaseEvaluation,
    purchaseEvaluation,
    costDetails,
  };
}