import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import KakaoAddressSearch from '@/components/KakaoAddressSearch';
import type { HotelInput, FacilityType, ADRGrade, OperationMode } from '@/lib/types';
import { DEFAULT_INPUT, REGIONS } from '@/lib/types';
import type { AddressSearchResult } from '@/lib/kakaoMap';

interface InputWizardProps {
  onCalculate: (input: HotelInput) => void;
  onAddressSelect?: (result: AddressSearchResult) => void;
}

const FACILITY_TYPES: FacilityType[] = ['모텔', '호텔'];
const ADR_GRADES: ADRGrade[] = ['A', 'B', 'C'];

export default function InputWizard({ onCalculate, onAddressSelect }: InputWizardProps) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<HotelInput>(DEFAULT_INPUT);

  const updateField = <K extends keyof HotelInput>(key: K, value: HotelInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  const handleAddressSelect = (result: AddressSearchResult) => {
    // 지역 자동 매핑
    if (REGIONS.includes(result.region)) {
      updateField('region', result.region);
    }
    onAddressSelect?.(result);
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  const handleSubmit = () => onCalculate(input);

  const stepTitles = ['사이트 기본 정보', '매출 변수', '운영 변수', '거래 조건'];

  return (
    <div className="w-full">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8 gap-2">
        {stepTitles.map((title, idx) => (
          <div key={title} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === idx + 1
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30'
                  : step > idx + 1
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600'
              }`}
            >
              {step > idx + 1 ? '✓' : idx + 1}
            </div>
            {idx < 3 && (
              <div className={`w-8 h-0.5 mx-1 ${step > idx + 1 ? 'bg-green-500/50' : 'bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <span className="text-blue-400">Step {step}.</span> {stepTitles[step - 1]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && <Step1 input={input} updateField={updateField} onAddressSelect={handleAddressSelect} />}
          {step === 2 && <Step2 input={input} updateField={updateField} />}
          {step === 3 && <Step3 input={input} updateField={updateField} />}
          {step === 4 && <Step4 input={input} updateField={updateField} />}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={step === 1}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              이전
            </Button>
            {step < 4 ? (
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                다음
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                분석 시작 🚀
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step Components ────────────────────────────────────────

function Step1({ input, updateField, onAddressSelect }: { input: HotelInput; updateField: <K extends keyof HotelInput>(key: K, val: HotelInput[K]) => void; onAddressSelect: (result: AddressSearchResult) => void }) {
  return (
    <div className="space-y-4">
      {/* 카카오맵 주소 검색 */}
      <div>
        <Label className="text-slate-300 mb-1.5 block">📍 주소 검색 (카카오맵)</Label>
        <KakaoAddressSearch onSelect={onAddressSelect} />
        <p className="text-xs text-slate-500 mt-1">주소를 검색하면 지역이 자동으로 설정됩니다</p>
      </div>

      <div className="border-t border-slate-700/50 pt-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label className="text-slate-300">호텔명</Label>
          <Input
            value={input.hotelName}
            onChange={e => updateField('hotelName', e.target.value)}
            placeholder="예: 해운대 오션뷰 호텔"
            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
          />
        </div>
        <div>
          <Label className="text-slate-300">지역 (자동/수동 선택)</Label>
          <Select value={input.region} onValueChange={v => updateField('region', v)}>
            <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {REGIONS.map(r => <SelectItem key={r} value={r} className="text-white">{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-slate-300">시설 유형</Label>
          <Select value={input.facilityType} onValueChange={v => updateField('facilityType', v as FacilityType)}>
            <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {FACILITY_TYPES.map(f => <SelectItem key={f} value={f} className="text-white">{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-slate-300">총 객실 수</Label>
          <Input
            type="number"
            value={input.totalRooms}
            onChange={e => updateField('totalRooms', Number(e.target.value))}
            className="bg-slate-900/50 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label className="text-slate-300">연면적 (평)</Label>
          <Input
            type="number"
            value={input.totalArea}
            onChange={e => updateField('totalArea', Number(e.target.value))}
            className="bg-slate-900/50 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label className="text-slate-300">층수</Label>
          <Input
            type="number"
            value={input.floors}
            onChange={e => updateField('floors', Number(e.target.value))}
            className="bg-slate-900/50 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label className="text-slate-300">엘리베이터 수</Label>
          <Input
            type="number"
            value={input.elevators}
            onChange={e => updateField('elevators', Number(e.target.value))}
            className="bg-slate-900/50 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label className="text-slate-300">계약전력 (kW, 0=자동산정)</Label>
          <Input
            type="number"
            value={input.contractPower}
            onChange={e => updateField('contractPower', Number(e.target.value))}
            className="bg-slate-900/50 border-slate-600 text-white"
          />
        </div>
      </div>
    </div>
  );
}

function Step2({ input, updateField }: { input: HotelInput; updateField: <K extends keyof HotelInput>(key: K, val: HotelInput[K]) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="text-slate-300">ADR (평균 객실 단가, ₩)</Label>
        <Input
          type="number"
          value={input.adr}
          onChange={e => updateField('adr', Number(e.target.value))}
          className="bg-slate-900/50 border-slate-600 text-white"
        />
      </div>
      <div>
        <Label className="text-slate-300">가동률 (%)</Label>
        <Input
          type="number"
          value={Math.round(input.occupancyRate * 100)}
          onChange={e => updateField('occupancyRate', Number(e.target.value) / 100)}
          className="bg-slate-900/50 border-slate-600 text-white"
        />
      </div>
      <div>
        <Label className="text-slate-300">월 영업일수</Label>
        <Input
          type="number"
          value={input.businessDays}
          onChange={e => updateField('businessDays', Number(e.target.value))}
          className="bg-slate-900/50 border-slate-600 text-white"
        />
      </div>
      <div>
        <Label className="text-slate-300">F&B 단가 (₩)</Label>
        <Input
          type="number"
          value={input.fnbUnitPrice}
          onChange={e => updateField('fnbUnitPrice', Number(e.target.value))}
          className="bg-slate-900/50 border-slate-600 text-white"
        />
      </div>
      <div>
        <Label className="text-slate-300">어메니티 단가 (₩)</Label>
        <Input
          type="number"
          value={input.amenityUnitPrice}
          onChange={e => updateField('amenityUnitPrice', Number(e.target.value))}
          className="bg-slate-900/50 border-slate-600 text-white"
        />
      </div>
    </div>
  );
}

function Step3({ input, updateField }: { input: HotelInput; updateField: <K extends keyof HotelInput>(key: K, val: HotelInput[K]) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="text-slate-300">운영 모드</Label>
        <Select value={input.operationMode} onValueChange={v => updateField('operationMode', v as OperationMode)}>
          <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="마스터리스" className="text-white">마스터리스</SelectItem>
            <SelectItem value="매수" className="text-white">매수</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-slate-300">ADR 등급</Label>
        <Select value={input.adrGrade} onValueChange={v => updateField('adrGrade', v as ADRGrade)}>
          <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {ADR_GRADES.map(g => (
              <SelectItem key={g} value={g} className="text-white">
                {g} ({g === 'A' ? '20만원+' : g === 'B' ? '10~20만원' : '10만원 미만'})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-slate-300">운영 등급</Label>
        <Select value={input.operationGrade} onValueChange={v => updateField('operationGrade', v as ADRGrade)}>
          <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {ADR_GRADES.map(g => (
              <SelectItem key={g} value={g} className="text-white">
                {g} 등급
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-slate-300">브랜드 등급</Label>
        <Select value={input.brandGrade} onValueChange={v => updateField('brandGrade', v as ADRGrade)}>
          <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {ADR_GRADES.map(g => (
              <SelectItem key={g} value={g} className="text-white">
                {g} 등급
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-slate-300">프론트 인원 수</Label>
        <Input
          type="number"
          value={input.frontXCount}
          onChange={e => updateField('frontXCount', Number(e.target.value))}
          className="bg-slate-900/50 border-slate-600 text-white"
        />
      </div>
      <div>
        <Label className="text-slate-300">자쿠지 객실 수</Label>
        <Input
          type="number"
          value={input.jacuzziRooms}
          onChange={e => updateField('jacuzziRooms', Number(e.target.value))}
          className="bg-slate-900/50 border-slate-600 text-white"
        />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-700">
        <Label className="text-slate-300">프론트X 시스템</Label>
        <Switch
          checked={input.hasFrontX}
          onCheckedChange={v => updateField('hasFrontX', v)}
        />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-700">
        <Label className="text-slate-300">F&B 운영</Label>
        <Switch
          checked={input.hasFnb}
          onCheckedChange={v => updateField('hasFnb', v)}
        />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-700">
        <Label className="text-slate-300">어메니티 운영</Label>
        <Switch
          checked={input.hasAmenity}
          onCheckedChange={v => updateField('hasAmenity', v)}
        />
      </div>
    </div>
  );
}

function Step4({ input, updateField }: { input: HotelInput; updateField: <K extends keyof HotelInput>(key: K, val: HotelInput[K]) => void }) {
  return (
    <div className="space-y-4">
      {input.operationMode === '마스터리스' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <p className="text-sm text-blue-400 mb-2">📋 마스터리스 조건</p>
          </div>
          <div>
            <Label className="text-slate-300">월 임대료 (₩)</Label>
            <Input
              type="number"
              value={input.monthlyRent}
              onChange={e => updateField('monthlyRent', Number(e.target.value))}
              className="bg-slate-900/50 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300">보증금 (₩)</Label>
            <Input
              type="number"
              value={input.deposit}
              onChange={e => updateField('deposit', Number(e.target.value))}
              className="bg-slate-900/50 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300">계약 기간 (년)</Label>
            <Input
              type="number"
              value={input.leaseTerm}
              onChange={e => updateField('leaseTerm', Number(e.target.value))}
              className="bg-slate-900/50 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300">연 임대료 인상률 (%)</Label>
            <Input
              type="number"
              value={Math.round(input.rentIncreaseRate * 100)}
              onChange={e => updateField('rentIncreaseRate', Number(e.target.value) / 100)}
              className="bg-slate-900/50 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300">TI 월 상각액 (₩)</Label>
            <Input
              type="number"
              value={input.tiAmount}
              onChange={e => updateField('tiAmount', Number(e.target.value))}
              placeholder="0 = TI 없음"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">Tenant Improvement 투자금의 월 상각액</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <p className="text-sm text-purple-400 mb-2">🏢 매수 조건</p>
          </div>
          <div>
            <Label className="text-slate-300">매입가 (₩)</Label>
            <Input
              type="number"
              value={input.purchasePrice}
              onChange={e => updateField('purchasePrice', Number(e.target.value))}
              className="bg-slate-900/50 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300">대출금 (₩)</Label>
            <Input
              type="number"
              value={input.loanAmount}
              onChange={e => updateField('loanAmount', Number(e.target.value))}
              className="bg-slate-900/50 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300">대출 이자율 (%)</Label>
            <Input
              type="number"
              value={(input.loanRate * 100).toFixed(1)}
              onChange={e => updateField('loanRate', Number(e.target.value) / 100)}
              className="bg-slate-900/50 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300">대출 기간 (년)</Label>
            <Input
              type="number"
              value={input.loanTerm}
              onChange={e => updateField('loanTerm', Number(e.target.value))}
              className="bg-slate-900/50 border-slate-600 text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}