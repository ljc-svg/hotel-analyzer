import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend, ResponsiveContainer,
} from 'recharts';
import type { CalculationResult } from '@/lib/types';

interface ChartsProps {
  result: CalculationResult;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

function formatAxis(value: number): string {
  if (Math.abs(value) >= 100000000) return `${(value / 100000000).toFixed(0)}억`;
  if (Math.abs(value) >= 10000) return `${(value / 10000).toFixed(0)}만`;
  return value.toString();
}

export default function Charts({ result }: ChartsProps) {
  // Revenue Pie Data
  const revenuePieData = [
    { name: '객실 매출', value: result.revenue.roomRevenue },
    ...(result.revenue.fnbRevenue > 0 ? [{ name: 'F&B 매출', value: result.revenue.fnbRevenue }] : []),
    ...(result.revenue.amenityRevenue > 0 ? [{ name: '어메니티 매출', value: result.revenue.amenityRevenue }] : []),
  ];

  // Cost Bar Data
  const costBarData = result.costDetails.map(item => ({
    name: item.category,
    금액: item.amount,
  }));

  // Monthly Line Data
  const monthlyData = result.monthlyPnL.map(m => ({
    name: m.monthName,
    매출: m.revenue,
    비용: m.costs,
    NOI: m.noi,
  }));

  return (
    <div className="space-y-6">
      {/* Revenue Pie Chart */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-lg">🥧 매출 구성</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <ResponsiveContainer width={280} height={250}>
              <PieChart>
                <Pie
                  data={revenuePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {revenuePieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₩${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {revenuePieData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-slate-300 text-sm">{item.name}</span>
                  <span className="text-white text-sm font-mono ml-auto">₩{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Bar Chart */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-lg">📊 비용 항목별 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costBarData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatAxis} />
              <Tooltip
                formatter={(value: number) => `₩${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="금액" radius={[4, 4, 0, 0]}>
                {costBarData.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Line Chart */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-lg">📈 12개월 손익 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatAxis} />
              <Tooltip
                formatter={(value: number) => `₩${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="매출" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="비용" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="NOI" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}