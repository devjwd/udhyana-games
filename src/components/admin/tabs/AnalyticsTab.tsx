'use client';

import React, { useState } from 'react';

export interface StationMetric {
  id: string;
  name: string;
  revenue: number;
  sessionsCount: number;
  playtimeMinutes: number;
  playtimeHours: number;
  utilizationPct: number;
}

export interface HourlyMetric {
  hour: number;
  label: string;
  revenue: number;
  ordersCount: number;
}

export interface DayPartMetric {
  key: string;
  name: string;
  revenue: number;
  count: number;
  pct: number;
}

export interface AnalyticsData {
  timeframe: '7d' | '30d' | 'all';
  totalRevenue: number;
  totalOrders: number;
  totalSessions: number;
  totalPlaytimeHours: number;
  avgOrderValue: number;
  peakHour: {
    label: string;
    revenue: number;
    sharePct: number;
  };
  stationPerformance: StationMetric[];
  hourlyRevenue: HourlyMetric[];
  dayParts: DayPartMetric[];
  revenueStreams: {
    sessions: number;
    snacks: number;
    products: number;
    sessionsPct: number;
    snacksPct: number;
    productsPct: number;
  };
  paymentMethods: {
    cash: number;
    card: number;
    account: number;
    cashPct: number;
    cardPct: number;
    accountPct: number;
  };
  revenueByDay: { date: string; amount: number }[];
}

interface AnalyticsTabProps {
  analytics: AnalyticsData | null;
  onTimeframeChange?: (timeframe: '7d' | '30d' | 'all') => void;
  isLoading?: boolean;
}

export default function AnalyticsTab({
  analytics,
  onTimeframeChange,
  isLoading = false
}: AnalyticsTabProps) {
  const [activeRange, setActiveRange] = useState<'7d' | '30d' | 'all'>('7d');

  if (!analytics || isLoading) {
    return (
      <div style={{ color: 'white', padding: '3rem', textAlign: 'center', background: '#0E0F14', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
        <div style={{ fontWeight: 800, letterSpacing: '0.05em' }}>Loading Executive Revenue & Station Analytics...</div>
      </div>
    );
  }

  const handleRangeSelect = (range: '7d' | '30d' | 'all') => {
    setActiveRange(range);
    if (onTimeframeChange) onTimeframeChange(range);
  };

  const maxDailyAmount = Math.max(...analytics.revenueByDay.map(d => d.amount), 1);
  const maxHourlyAmount = Math.max(...analytics.hourlyRevenue.map(h => h.revenue), 1);
  const maxStationRevenue = Math.max(...analytics.stationPerformance.map(s => s.revenue), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: '#fff' }}>
      {/* Dashboard Top Header & Range Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0E0F14',
        padding: '1.25rem 1.5rem',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Lounge Intelligence & Revenue Analytics
          </h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            Real-time station revenue, peak hour heatmap, and operational performance metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', background: '#060608', padding: '0.3rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {(['7d', '30d', 'all'] as const).map(range => (
            <button
              key={range}
              type="button"
              onClick={() => handleRangeSelect(range)}
              style={{
                background: activeRange === range ? 'var(--primary-accent)' : 'transparent',
                color: activeRange === range ? '#000' : 'rgba(255,255,255,0.7)',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.78rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: 'var(--primary-accent)' }} />
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Total Revenue</span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-accent)', margin: '0.35rem 0 0.15rem' }}>
            PKR {analytics.totalRevenue.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{analytics.totalOrders} total completed orders</span>
        </div>

        <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: '#60a5fa' }} />
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Total Playtime</span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#60a5fa', margin: '0.35rem 0 0.15rem' }}>
            {analytics.totalPlaytimeHours} hrs
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>across {analytics.totalSessions} sessions</span>
        </div>

        <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: '#ffb400' }} />
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Peak Earning Time</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffb400', margin: '0.5rem 0 0.15rem' }}>
            {analytics.peakHour.label || 'Evening Hours'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
            PKR {analytics.peakHour.revenue.toLocaleString()} ({analytics.peakHour.sharePct}% share)
          </span>
        </div>

        <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: '#a78bfa' }} />
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Average Order Value</span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#a78bfa', margin: '0.35rem 0 0.15rem' }}>
            PKR {analytics.avgOrderValue.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>per customer transaction</span>
        </div>
      </div>

      {/* Peak Gaming Hours Heatmap & Time-of-Day Distribution */}
      <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⏰ Hourly Revenue & Peak Earning Times (24-Hour Timeline)
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
              Identify which hours generate maximum lounge income to optimize staff shifts and promotions.
            </p>
          </div>
          <div style={{ background: 'rgba(255, 180, 0, 0.1)', color: '#ffb400', border: '1px solid rgba(255, 180, 0, 0.3)', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
            🔥 Peak Time: {analytics.peakHour.label}
          </div>
        </div>

        {/* 24-Hour Bar Chart */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '220px',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          gap: '4px'
        }}>
          {analytics.hourlyRevenue.map((h) => {
            const heightPct = Math.max(4, (h.revenue / maxHourlyAmount) * 100);
            const isPeak = h.revenue === maxHourlyAmount && h.revenue > 0;

            return (
              <div
                key={h.hour}
                title={`${h.label}: PKR ${h.revenue.toLocaleString()} (${h.ordersCount} orders)`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  height: '100%',
                  justifyContent: 'flex-end',
                  position: 'relative'
                }}
              >
                {h.revenue > 0 && (
                  <div style={{
                    fontSize: '0.65rem',
                    color: isPeak ? 'var(--primary-accent)' : 'rgba(255,255,255,0.7)',
                    fontWeight: isPeak ? 900 : 600,
                    marginBottom: '4px',
                    whiteSpace: 'nowrap'
                  }}>
                    {h.revenue >= 1000 ? `${Math.round(h.revenue / 1000)}k` : h.revenue}
                  </div>
                )}
                <div
                  style={{
                    width: '80%',
                    maxWidth: '32px',
                    height: `${heightPct}%`,
                    background: isPeak
                      ? 'linear-gradient(180deg, #c1ff1c 0%, #ffb400 100%)'
                      : h.revenue > 0
                        ? 'linear-gradient(180deg, rgba(96, 165, 250, 0.9) 0%, rgba(96, 165, 250, 0.2) 100%)'
                        : 'rgba(255,255,255,0.03)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease',
                    boxShadow: isPeak ? '0 0 15px rgba(193, 255, 28, 0.4)' : 'none'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '-2rem',
                  fontSize: '0.65rem',
                  color: isPeak ? 'var(--primary-accent)' : 'rgba(255,255,255,0.5)',
                  fontWeight: isPeak ? 900 : 600,
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'top left',
                  whiteSpace: 'nowrap'
                }}>
                  {h.hour % 2 === 0 ? h.label : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day-Part Distribution Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {analytics.dayParts.map(part => (
            <div
              key={part.key}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>{part.name}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>PKR {part.revenue.toLocaleString()}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                <span>{part.count} orders</span>
                <span style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>{part.pct}% of total</span>
              </div>
              {/* Progress bar */}
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.25rem' }}>
                <div style={{ width: `${part.pct}%`, height: '100%', background: 'var(--primary-accent)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Station-by-Station Revenue & Occupancy Breakdown */}
      <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🎮 Station-by-Station Performance & Revenue Ranking
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
              Compare console hardware profitability, hours logged, and station occupancy rates.
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>
            {analytics.stationPerformance.length} Total Stations
          </span>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800 }}>Rank & Station</th>
                <th style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800 }}>Revenue Generated</th>
                <th style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800 }}>Playtime Logged</th>
                <th style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800 }}>Total Sessions</th>
                <th style={{ padding: '0.85rem 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, textAlign: 'right' }}>Occupancy Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.stationPerformance.map((station, idx) => {
                const revenuePct = maxStationRevenue > 0 ? (station.revenue / maxStationRevenue) * 100 : 0;
                const isTopEarner = idx === 0 && station.revenue > 0;

                return (
                  <tr key={station.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isTopEarner ? 'var(--primary-accent)' : 'rgba(255,255,255,0.08)',
                        color: isTopEarner ? '#000' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 900
                      }}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>
                          {station.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                          ID: {station.id}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 900, color: 'var(--primary-accent)', fontSize: '1.05rem' }}>
                        PKR {station.revenue.toLocaleString()}
                      </div>
                      {/* Revenue relative bar */}
                      <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.35rem' }}>
                        <div style={{ width: `${revenuePct}%`, height: '100%', background: isTopEarner ? 'var(--primary-accent)' : '#60a5fa' }} />
                      </div>
                    </td>

                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
                      {station.playtimeHours} hrs
                    </td>

                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
                      {station.sessionsCount} sessions
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        background: station.utilizationPct >= 50
                          ? 'rgba(193, 255, 28, 0.15)'
                          : station.utilizationPct >= 20
                            ? 'rgba(96, 165, 250, 0.15)'
                            : 'rgba(255, 180, 0, 0.15)',
                        color: station.utilizationPct >= 50
                          ? 'var(--primary-accent)'
                          : station.utilizationPct >= 20
                            ? '#60a5fa'
                            : '#ffb400',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        {station.utilizationPct}% Active
                      </span>
                    </td>
                  </tr>
                );
              })}

              {analytics.stationPerformance.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                    No station performance data recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Streams & Payment Methods Distribution Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Revenue Streams */}
        <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💰 Revenue by Category
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>🎮 Console Game Sessions</span>
                <span style={{ fontWeight: 800 }}>PKR {analytics.revenueStreams.sessions.toLocaleString()} ({analytics.revenueStreams.sessionsPct}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.revenueStreams.sessionsPct}%`, height: '100%', background: 'var(--primary-accent)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>🥤 Snacks, Drinks & Quick Sale</span>
                <span style={{ fontWeight: 800 }}>PKR {analytics.revenueStreams.snacks.toLocaleString()} ({analytics.revenueStreams.snacksPct}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.revenueStreams.snacksPct}%`, height: '100%', background: '#ffb400' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>🛍️ Merchandise & Products</span>
                <span style={{ fontWeight: 800 }}>PKR {analytics.revenueStreams.products.toLocaleString()} ({analytics.revenueStreams.productsPct}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.revenueStreams.productsPct}%`, height: '100%', background: '#60a5fa' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Split */}
        <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💳 Payment Methods Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>💵 Cash in Register</span>
                <span style={{ fontWeight: 800 }}>PKR {analytics.paymentMethods.cash.toLocaleString()} ({analytics.paymentMethods.cashPct}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.paymentMethods.cashPct}%`, height: '100%', background: '#34d399' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>💳 Card & POS Terminal</span>
                <span style={{ fontWeight: 800 }}>PKR {analytics.paymentMethods.card.toLocaleString()} ({analytics.paymentMethods.cardPct}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.paymentMethods.cardPct}%`, height: '100%', background: '#60a5fa' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>📱 Account Credit & Digital</span>
                <span style={{ fontWeight: 800 }}>PKR {analytics.paymentMethods.account.toLocaleString()} ({analytics.paymentMethods.accountPct}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.paymentMethods.accountPct}%`, height: '100%', background: '#a78bfa' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Revenue Timeline Bar Chart */}
      <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '2rem' }}>
        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📅 Daily Revenue History
        </h3>

        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '240px',
          paddingBottom: '2rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          gap: '8px'
        }}>
          {analytics.revenueByDay.map((day) => {
            const heightPct = Math.max(4, (day.amount / maxDailyAmount) * 100);
            const dateObj = new Date(day.date);
            const displayDay = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const displayDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

            return (
              <div
                key={day.date}
                title={`${day.date}: PKR ${day.amount.toLocaleString()}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  height: '100%',
                  justifyContent: 'flex-end',
                  position: 'relative'
                }}
              >
                {day.amount > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: 800, marginBottom: '0.35rem' }}>
                    {day.amount >= 1000 ? `${Math.round(day.amount / 1000)}k` : day.amount}
                  </div>
                )}
                <div
                  style={{
                    width: '80%',
                    maxWidth: '44px',
                    height: `${heightPct}%`,
                    background: 'linear-gradient(180deg, var(--primary-accent) 0%, rgba(193, 255, 28, 0.25) 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '-1.85rem',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textAlign: 'center'
                }}>
                  {displayDay} <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>{displayDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
