'use client';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalSessions: number;
  revenueByDay: { date: string; amount: number }[];
}

interface AnalyticsTabProps {
  analytics: AnalyticsData | null;
}

export default function AnalyticsTab({ analytics }: AnalyticsTabProps) {
  if (!analytics) {
    return <div style={{ color: 'white', padding: '2rem' }}>Loading analytics...</div>;
  }

  // Find max amount to scale the bars
  const maxAmount = Math.max(...analytics.revenueByDay.map((d) => d.amount), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '2rem',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '0.5rem',
            }}
          >
            Total Revenue
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-accent)' }}>
            PKR {analytics.totalRevenue}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '2rem',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '0.5rem',
            }}
          >
            Total Orders
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>
            {analytics.totalOrders}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '2rem',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '0.5rem',
            }}
          >
            Total Sessions
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>
            {analytics.totalSessions}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '2rem',
          borderRadius: '12px',
        }}
      >
        <h2 style={{ color: 'white', fontSize: '1.5rem', margin: '0 0 2rem 0' }}>
          Revenue Last 7 Days
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: '300px',
            paddingBottom: '2rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
          }}
        >
          {analytics.revenueByDay
            .slice()
            .reverse()
            .map((day) => {
              const heightPct = (day.amount / maxAmount) * 100;
              const displayDate = new Date(day.date).toLocaleDateString('en-US', {
                weekday: 'short',
              });
              return (
                <div
                  key={day.date}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '10%',
                  }}
                >
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '0.8rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {day.amount > 0 ? day.amount : ''}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background:
                        'linear-gradient(180deg, var(--primary-accent) 0%, rgba(193, 255, 28, 0.2) 100%)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: '4px',
                      transition: 'height 1s ease-out',
                    }}
                  ></div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-2rem',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {displayDate}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
