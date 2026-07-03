import type { Player } from './PlayerCard';
import { TrendingUp, Award, DollarSign } from 'lucide-react';

interface DashboardProps {
  players: Player[];
  lineup: (Player | undefined)[];
  budget: number;
}

export function Dashboard({ players, lineup, budget }: DashboardProps) {
  // Calculations
  const squadValue = players.reduce((sum, p) => sum + p.price, 0);
  const activeLineup = lineup.filter(Boolean) as Player[];
  const projectedPoints = activeLineup.reduce((sum, p) => sum + p.xp, 0);

  // Formatting helper
  const formatMoney = (val: number) => {
    return (val / 1000000).toFixed(1) + ' Mio. €';
  };

  // Mock chart data for Market Value history
  const chartData = [
    { label: 'GW 30', value: 120 },
    { label: 'GW 31', value: 125 },
    { label: 'GW 32', value: 122 },
    { label: 'GW 33', value: 134 },
    { label: 'GW 34', value: 131 },
    { label: 'GW 35', value: 142 },
    { label: 'Heute', value: 148.5 },
  ];

  const maxVal = Math.max(...chartData.map(d => d.value));
  const minVal = Math.min(...chartData.map(d => d.value));
  const valRange = maxVal - minVal;

  // SVG dimensions
  const width = 500;
  const height = 180;
  const padding = 20;

  // Calculate SVG coordinates for line path
  const points = chartData.map((d, i) => {
    const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - minVal) / valRange) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  // Area path for gradient fill under the line
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">Dashboard</h1>
          <p className="text-xs text-successor-textMuted font-mono">Real-time Squad Analytics & Valuation</p>
        </div>
        <div className="px-3 py-1.5 bg-successor-mint/10 border border-successor-mint/20 rounded-xl text-successor-mint text-[11px] font-mono font-bold flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-successor-mint animate-pulse" />
          KICKBASE SEASON LIVE SYNC
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Team Value */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-32">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-successor-textMuted">Kaderwert</span>
              <div className="text-2xl font-black mt-1 text-white">{formatMoney(squadValue)}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
              <DollarSign size={16} className="text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-successor-mint text-[11px] font-bold relative z-10">
            <TrendingUp size={12} />
            <span>+4.2% diese Woche</span>
          </div>
        </div>

        {/* Card 2: Projected Points */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-32">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-successor-textMuted">Proj. Punkte (Sptg.)</span>
              <div className="text-2xl font-black mt-1 text-white">{projectedPoints} xP</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
              <Award size={16} className="text-gray-400" />
            </div>
          </div>
          <div className="text-[11px] text-successor-textMuted font-mono relative z-10">
            Basierend auf aktiver Formation
          </div>
        </div>

        {/* Card 3: Remaining Budget */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-32">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-successor-textMuted font-mono">Restbudget</span>
              <div className="text-2xl font-black mt-1 text-white">{formatMoney(budget)}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
              <DollarSign size={16} className="text-successor-mint" />
            </div>
          </div>
          <div className="text-[11px] text-successor-textMuted font-mono relative z-10">
            Sofort verfügbarer Cash-Bestand
          </div>
        </div>
      </div>

      {/* CHART & DETAILS VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart Column (2/3 width on desktop) */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Marktwert-Trend</h2>
              <span className="text-[10px] text-successor-textMuted font-mono">Verlauf deines Kaders über die letzten Spieltage</span>
            </div>
            <span className="text-[11px] font-black text-successor-mint bg-successor-mint/10 px-2 py-0.5 rounded-md font-mono">
              +{formatMoney(chartData[chartData.length - 1].value * 1000000 - chartData[0].value * 1000000)}
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full h-48 relative overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
              <defs>
                {/* Under-path fill gradient */}
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity="0.0" />
                </linearGradient>
                {/* Glow filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid Lines */}
              {[0, 1, 2, 3].map((g) => {
                const y = padding + (g / 3) * (height - padding * 2);
                return (
                  <line
                    key={g}
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Chart line area fill */}
              <path d={areaD} fill="url(#chartGradient)" />

              {/* Chart Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#00ff88"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#glow)"
              />

              {/* Chart Data Points & Labels */}
              {points.map((p, idx) => (
                <g key={idx} className="group/point">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#0d0e10"
                    stroke="#00ff88"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-6 hover:fill-[#00ff88] transition-all duration-150"
                  />
                  {/* Tooltip on point */}
                  <text
                    x={p.x}
                    y={p.y - 10}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="opacity-0 group-hover/point:opacity-100 transition-opacity bg-black/80 font-mono"
                  >
                    {chartData[idx].value}M
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex justify-between items-center px-2 pt-2 border-t border-white/[0.04] text-[9px] font-mono text-successor-textMuted uppercase">
            {chartData.map((d, i) => (
              <span key={i}>{d.label}</span>
            ))}
          </div>
        </div>

        {/* Top Performers (1/3 width on desktop) */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white mb-1">Key-Player</h2>
            <p className="text-[10px] text-successor-textMuted font-mono mb-4">Deine punktstärksten Kader-Mitglieder</p>
            
            <div className="space-y-3.5">
              {players.length === 0 ? (
                <div className="text-xs text-successor-textMuted text-center py-6">Keine Spieler im Kader</div>
              ) : (
                players.slice(0, 4).map((player) => (
                  <div key={player.id} className="flex justify-between items-center py-1.5 border-b border-white/[0.03] last:border-0">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center font-bold text-xs uppercase text-successor-mint">
                        {player.name.substring(0, 2)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-white truncate">{player.name}</div>
                        <div className="text-[8.5px] text-successor-textMuted uppercase font-mono">{player.position} • {player.team}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-white">{player.xp} xP</div>
                      <div className="text-[9px] text-successor-mint font-bold font-mono">
                        {formatMoney(player.price)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.03] flex justify-between items-center text-[10px] font-bold text-successor-textMuted">
            <span>Kader-Auslastung</span>
            <span className="font-mono text-white">{players.length}/18 Spieler</span>
          </div>
        </div>
      </div>
    </div>
  );
}
