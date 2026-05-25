import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CalculationResult } from '@/lib/types';

interface ResultsDashboardProps {
  result: CalculationResult;
}

function formatKRW(amount: number): string {
  if (Math.abs(amount) >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`;
  }
  if (Math.abs(amount) >= 10000) {
    return `${Math.round(amount / 10000).toLocaleString()}만`;
  }
  return amount.toLocaleString();
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
  const judgment = result.leaseEvaluation?.judgment ?? result.purchaseEvaluation?.judgment ?? '-';
  const judgmentColor = {
    GO: 'text-green-400 bg-green-500/10 border-green-500/30',
    BUY: 'text-green-400 bg-green-500/10 border-green-500/30',
    HOLD: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    WATCH: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    REJECT: 'text-red-400 bg-red-500/10 border-red-500/30',
    AVOID: 'text-red-400 bg-red-500/10 border-red-500/30',
    '-': 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  }[judgment] ?? 'text-slate-400';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="월 매출"
          value={`₩${formatKRW(result.revenue.total)}`}
          subtitle="Monthly Revenue"
          gradient="from-blue-500 to-cyan-500"
        />
        <SummaryCard
          title="월 NOI"
          value={`₩${formatKRW(result.monthlyNOI)}`}
          subtitle="Net Operating Income"
          gradient={result.monthlyNOI >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500'}
        />
        <SummaryCard
          title="NOI 마진"
          value={`${result.noiMargin.toFixed(1)}%`}
          subtitle="Profit Margin"
          gradient={result.noiMargin >= 20 ? 'from-green-500 to-emerald-500' : result.noiMargin >= 0 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-rose-500'}
        />
        <div className={`rounded-xl border p-4 ${judgmentColor}`}>
          <p className="text-xs uppercase tracking-wide opacity-70">판정 결과</p>
          <p className="text-3xl font-bold mt-1">{judgment}</p>
          <p className="text-xs opacity-60 mt-1">
            {result.leaseEvaluation ? 'Master Lease' : 'Purchase'}
          </p>
        </div>
      </div>

      {/* Cost Breakdown Table */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-lg">📊 비용 구성</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {result.costDetails.map(item => (
              <div key={item.category} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-300 text-sm">{item.category}</span>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-mono w-28 text-right">
                    ₩{item.amount.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-xs w-12 text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-slate-600">
              <span className="text-white font-bold">총 비용</span>
              <span className="text-white font-bold font-mono">₩{result.costs.total.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lease Evaluation */}
      {result.leaseEvaluation && (
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg">📋 마스터리스 4대 조건 평가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.leaseEvaluation.conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${cond.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {cond.passed ? '✅' : '❌'}
                    </span>
                    <span className="text-slate-300 text-sm">{cond.label}</span>
                  </div>
                  <span className={`text-sm font-mono ${cond.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {cond.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Evaluation */}
      {result.purchaseEvaluation && (
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg">🏢 매수 평가 지표</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard label="적정가격" value={`₩${formatKRW(result.purchaseEvaluation.properPrice)}`} />
              <MetricCard
                label="가격 차이"
                value={`₩${formatKRW(result.purchaseEvaluation.priceGap)}`}
                negative={result.purchaseEvaluation.priceGap > 0}
              />
              <MetricCard
                label="Cash-on-Cash ROI"
                value={`${(result.purchaseEvaluation.cashOnCashROI * 100).toFixed(1)}%`}
                positive={result.purchaseEvaluation.cashOnCashROI >= 0.08}
              />
              <MetricCard
                label="DSCR"
                value={result.purchaseEvaluation.dscr.toFixed(2)}
                positive={result.purchaseEvaluation.dscr >= 1.3}
              />
              <MetricCard
                label="투자 회수 기간"
                value={`${result.purchaseEvaluation.paybackYears.toFixed(1)}년`}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, gradient }: { title: string; value: string; subtitle: string; gradient: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
      <div className="relative p-4 border border-slate-700/50 rounded-xl">
        <p className="text-xs text-slate-400 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  const colorClass = positive ? 'text-green-400' : negative ? 'text-red-400' : 'text-white';
  return (
    <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-lg font-bold font-mono mt-1 ${colorClass}`}>{value}</p>
    </div>
  );
}