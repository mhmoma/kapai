import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { StatusMap } from '../types/game';

// Crisp Pixel Grid Renderer
interface PixelGridProps {
  grid: string[];
  palette: Record<string, string>;
  className?: string;
}

export const PixelGrid: React.FC<PixelGridProps> = ({
  grid,
  palette,
  className = 'w-12 h-12',
}) => {
  const height = grid.length;
  const width = grid[0]?.length || 16;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      className={className}
    >
      {grid.map((row, y) =>
        row.split('').map((cell, x) => {
          const color = palette[cell];
          if (!color || cell === '.') return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1.06}
              height={1.06}
              fill={color}
            />
          );
        })
      )}
    </svg>
  );
};

// Interactive 60FPS Pixel Particle Canvas
export const ParticleCanvas: React.FC<{
  theme?: 'ember' | 'arcane' | 'emerald' | 'gold' | 'crimson_berserk' | 'spire_title';
  className?: string;
}> = ({ theme = 'ember', className = 'absolute inset-0 pointer-events-none' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth || 1200);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight || 700);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth || 1200;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight || 700;
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: -9999, y: -9999 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    if (theme === 'spire_title') {
      window.addEventListener('mousemove', handleMouseMove);
    }

    const isBerserk = theme === 'crimson_berserk';
    const isTitle = theme === 'spire_title';
    const colors =
      theme === 'spire_title'
        ? ['#fde047', '#fbbf24', '#f59e0b', '#38bdf8', '#7dd3fc', '#f97316', '#fef08a']
        : theme === 'crimson_berserk'
        ? ['#ef4444', '#dc2626', '#f97316', '#facc15', '#fca5a5', '#991b1b']
        : theme === 'arcane'
        ? ['#38bdf8', '#818cf8', '#e0f2fe', '#c084fc', '#facc15']
        : theme === 'emerald'
        ? ['#10b981', '#34d399', '#a7f3d0', '#a855f7', '#fde047']
        : theme === 'gold'
        ? ['#fef08a', '#facc15', '#f59e0b', '#fbbf24', '#ffffff']
        : ['#f97316', '#facc15', '#ef4444', '#fef08a', '#fb923c'];

    const count = isTitle ? 110 : isBerserk ? 92 : 56;
    const particles = Array.from({ length: count }, (_, idx) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isSoulWisp = isTitle && (color === '#38bdf8' || color === '#7dd3fc' || idx % 5 === 0);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: isTitle
          ? isSoulWisp
            ? 4 + Math.floor(Math.random() * 4)
            : 2 + Math.floor(Math.random() * 4)
          : isBerserk
          ? Math.random() > 0.25
            ? 4
            : 7
          : Math.random() > 0.35
          ? 3
          : 5,
        vx: (Math.random() - 0.5) * (isBerserk ? 1.35 : isTitle ? 0.75 : 0.55),
        vy: isBerserk
          ? -1.1 - Math.random() * 2.4
          : isTitle
          ? -0.45 - Math.random() * 1.35
          : -0.35 - Math.random() * 1.05,
        color,
        isSoulWisp,
        alpha: (isBerserk ? 0.45 : isTitle ? 0.35 : 0.25) + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
      };
    });

    // Shooting arcane/gold meteors for title screen
    const meteors = isTitle
      ? Array.from({ length: 3 }, () => ({
          x: Math.random() * width,
          y: Math.random() * (height * 0.6),
          vx: 3.2 + Math.random() * 2.5,
          vy: -1.2 - Math.random() * 1.2,
          len: 36 + Math.random() * 40,
          alpha: 0,
          cooldown: Math.floor(Math.random() * 180),
          color: Math.random() > 0.45 ? '#fde047' : '#38bdf8',
        }))
      : [];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.phase += isBerserk ? 0.065 : isTitle ? 0.04 : 0.03;
        let dx = p.vx + Math.sin(p.phase) * (isBerserk ? 0.75 : isTitle ? 0.5 : 0.32);
        let dy = p.vy;

        if (isTitle && mouse.x > 0) {
          const distX = p.x - mouse.x;
          const distY = p.y - mouse.y;
          const distSq = distX * distX + distY * distY;
          if (distSq < 18000 && distSq > 1) {
            const force = (18000 - distSq) / 18000;
            dx += (distX / Math.sqrt(distSq)) * force * 1.6;
            dy += (distY / Math.sqrt(distSq)) * force * 1.6;
          }
        }

        p.x += dx;
        p.y += dy;

        if (p.y < -16) {
          p.y = height + 12;
          p.x = Math.random() * width;
        }
        if (p.x < -16) p.x = width + 12;
        if (p.x > width + 16) p.x = -12;

        const curAlpha = p.alpha * (0.65 + 0.35 * Math.sin(p.phase * 2));
        ctx.globalAlpha = curAlpha;
        ctx.fillStyle = p.color;
        const px = Math.round(p.x / 2) * 2;
        const py = Math.round(p.y / 2) * 2;
        ctx.fillRect(px, py, p.size, p.size);

        // Subtle pixel halo for soul wisps on title screen
        if (p.isSoulWisp) {
          ctx.globalAlpha = curAlpha * 0.28;
          ctx.fillRect(px - 2, py - 2, p.size + 4, p.size + 4);
          ctx.globalAlpha = curAlpha * 0.85;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 1, py + 1, Math.max(2, p.size - 2), Math.max(2, p.size - 2));
        }
      });

      // Render occasional energy streaks on title screen
      meteors.forEach((m) => {
        if (m.cooldown > 0) {
          m.cooldown--;
          if (m.cooldown === 0) {
            m.x = 180 + Math.random() * 280; // Originate near the Spire pillar
            m.y = height * (0.25 + Math.random() * 0.65);
            m.vx = (Math.random() - 0.25) * 4.5;
            m.vy = -2.8 - Math.random() * 2.2;
            m.alpha = 0.85;
          }
          return;
        }
        m.x += m.vx;
        m.y += m.vy;
        m.alpha -= 0.018;
        if (m.alpha <= 0) {
          m.cooldown = 90 + Math.floor(Math.random() * 180);
          return;
        }
        ctx.save();
        ctx.globalAlpha = m.alpha;
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 5, m.y - m.vy * 5);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(m.x - 1, m.y - 1, 3, 3);
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (theme === 'spire_title') {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [theme]);

  return <canvas ref={canvasRef} className={className} />;
};

// ============================================================================
// Unified Spire Storm & Cloud-Sea Atmospheric Backdrop (Main Cover & Global UI)
// ============================================================================
export const SpireStormBackdrop: React.FC<{
  variant?: 'title' | 'ui' | 'map';
}> = ({ variant = 'title' }) => {
  const isTitle = variant === 'title';
  const isMap = variant === 'map';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. 天空与风暴云海基调渐变 (Teal-Slate Sky + Deep Obsidian Horizon) */}
      <div
        className="absolute inset-0"
        style={{
          background: isTitle
            ? 'linear-gradient(180deg, #16121d 0%, #2d4049 34%, #4f6c73 64%, #2a3942 88%, #12171d 100%)'
            : isMap
            ? 'linear-gradient(180deg, #120f18 0%, #1f2d35 45%, #162026 80%, #0b0f14 100%)'
            : 'linear-gradient(180deg, #14111b 0%, #24353e 38%, #344952 68%, #161e24 100%)',
        }}
      />

      {/* 2. 尖塔纹理底图叠层 */}
      <img
        src="/src/assets/images/spire_hero_bg_1791769516494.jpg"
        alt="Spire Backdrop"
        className={`absolute inset-0 w-full h-full object-cover mix-blend-overlay ${
          isTitle ? 'opacity-40 scale-105 animate-spire-bg-breathe' : 'opacity-25'
        }`}
        referrerPolicy="no-referrer"
      />

      {/* 3. 动态高塔、旋转金色云涡、雷霆电弧、漂浮流云 SVG 全景画布 */}
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className={`absolute inset-0 w-full h-full ${isTitle ? 'opacity-100' : 'opacity-55'}`}
      >
        <defs>
          <radialGradient id="spireTopGlow" cx="18%" cy="8%" r="32%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
            <stop offset="22%" stopColor="#fbbf24" stopOpacity="0.88" />
            <stop offset="52%" stopColor="#d97706" stopOpacity="0.52" />
            <stop offset="78%" stopColor="#78350f" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1e1b24" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="spireSoulAura" cx="50%" cy="48%" r="42%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="towerBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d1412" />
            <stop offset="28%" stopColor="#5e4236" />
            <stop offset="55%" stopColor="#463027" />
            <stop offset="82%" stopColor="#2a1c17" />
            <stop offset="100%" stopColor="#140d0b" />
          </linearGradient>
          <linearGradient id="darkCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#231c26" stopOpacity="0.96" />
            <stop offset="65%" stopColor="#3f313e" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#664f58" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="warmCloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a8847e" stopOpacity="0.86" />
            <stop offset="50%" stopColor="#634b53" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2a2028" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="godRayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.38" />
            <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 中央魂火与圣光环境光晕 */}
        <rect x="0" y="0" width="1920" height="1080" fill="url(#spireSoulAura)" />

        {/* 远景深邃天幕云层 */}
        <path
          d="M0,185 Q480,115 960,215 T1920,165 L1920,0 L0,0 Z"
          fill="#1e1824"
          opacity="0.94"
        />
        <path
          d="M320,0 Q680,265 1280,190 T1920,285 L1920,0 Z"
          fill="url(#darkCloudGrad)"
          className="animate-cloud-drift-slow"
        />

        {/* 塔顶倾泻而下的圣光体积光束 (Volumetric Golden God-Rays) */}
        <g className="animate-pulse-glow">
          <polygon points="345,75 820,1080 560,1080" fill="url(#godRayGrad)" />
          <polygon points="345,75 1280,1080 960,1080" fill="url(#godRayGrad)" opacity="0.65" />
          <polygon points="345,75 180,1080 40,1080" fill="url(#godRayGrad)" opacity="0.55" />
        </g>

        {/* 塔顶金色风暴漩涡与旋转法阵环 (Golden Storm Vortex at Top-Left) */}
        <ellipse
          cx="345"
          cy="92"
          rx="490"
          ry="225"
          fill="url(#spireTopGlow)"
          className="animate-vortex-breathe"
        />
        <ellipse
          cx="345"
          cy="78"
          rx="310"
          ry="130"
          fill="none"
          stroke="#fde047"
          strokeWidth="2.5"
          strokeDasharray="18 14 6 10"
          opacity="0.45"
        />
        <ellipse
          cx="345"
          cy="78"
          rx="210"
          ry="86"
          fill="none"
          stroke="#fef08a"
          strokeWidth="3"
          strokeDasharray="12 18"
          opacity="0.65"
        />
        <ellipse cx="345" cy="70" rx="235" ry="98" fill="#fef08a" opacity="0.55" />
        <ellipse cx="345" cy="64" rx="115" ry="46" fill="#ffffff" opacity="0.7" />

        {/* 塔顶雷暴闪电裂隙 (Storm Lightning Arcs around the Spire Peak) */}
        <g className="animate-spire-lightning">
          <polyline
            points="250,45 215,95 245,110 190,175 210,190 165,245"
            fill="none"
            stroke="#fef08a"
            strokeWidth="3.5"
          />
          <polyline
            points="440,52 485,105 455,122 520,188 495,210 545,265"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          <polyline
            points="355,95 395,145 370,168 425,230"
            fill="none"
            stroke="#fde047"
            strokeWidth="2.5"
          />
        </g>

        {/* 左侧擎天高塔本体 (The Colossal Spire Pillar on Left) */}
        <polygon points="258,1080 310,88 382,88 432,1080" fill="url(#towerBodyGrad)" />

        {/* 高塔左侧受光石壁与古老城垛阶梯刻痕 */}
        <polygon points="310,88 348,88 334,1080 258,1080" fill="#8b634c" opacity="0.38" />
        <polygon points="296,260 394,282 398,302 292,280" fill="#1a110e" opacity="0.75" />
        <polygon points="288,450 402,475 406,496 284,472" fill="#1a110e" opacity="0.75" />
        <polygon points="278,660 412,688 416,712 274,684" fill="#1a110e" opacity="0.78" />
        <polygon points="268,850 422,878 426,902 264,874" fill="#1a110e" opacity="0.82" />
        <path
          d="M302,180 L386,205 M296,360 L392,390 M290,550 L398,575 M280,760 L408,790 M272,940 L416,965"
          stroke="#140c0a"
          strokeWidth="4.5"
          opacity="0.8"
        />

        {/* 高塔内部脉动的熔岩与奥术能量窗 (Pulsing Spire Rune Windows & Fissures) */}
        <g className="animate-pulse">
          <rect x="336" y="145" width="8" height="22" rx="3" fill="#fef08a" />
          <rect x="352" y="215" width="7" height="18" rx="3" fill="#38bdf8" />
          <rect x="324" y="320" width="9" height="24" rx="3" fill="#fbbf24" />
          <rect x="360" y="410" width="8" height="20" rx="3" fill="#f97316" />
          <rect x="332" y="515" width="10" height="26" rx="4" fill="#38bdf8" />
          <rect x="355" y="610" width="9" height="22" rx="3" fill="#fbbf24" />
          <circle cx="310" cy="720" r="5" fill="#fb923c" />
          <circle cx="355" cy="790" r="6" fill="#f97316" />
          <circle cx="385" cy="860" r="7" fill="#fbbf24" />
          <circle cx="340" cy="915" r="5.5" fill="#f97316" />
          <circle cx="370" cy="960" r="8" fill="#fb923c" />
          <circle cx="325" cy="1010" r="6" fill="#facc15" />
          <circle cx="390" cy="1040" r="7" fill="#ea580c" />
          <path
            d="M342,720 L355,790 L340,855 L368,960 L350,1050"
            fill="none"
            stroke="#fb923c"
            strokeWidth="2.5"
            strokeDasharray="8 10"
            opacity="0.75"
          />
        </g>

        {/* 横穿高塔与天空的多层动态流云 (Layered Drifting Storm Clouds) */}
        <g className="animate-cloud-drift-fast">
          <path
            d="M95,430 Q260,390 445,415 Q575,432 415,458 Q240,472 95,430 Z"
            fill="#2b212d"
            opacity="0.92"
          />
          <path
            d="M410,470 Q780,345 1190,235 Q1360,185 1475,235 Q1225,392 890,488 Q620,552 410,470 Z"
            fill="url(#warmCloudGrad)"
          />
        </g>

        <g className="animate-cloud-drift-slow">
          <path
            d="M1050,560 Q1480,425 1920,345 L1920,665 Q1460,685 1050,560 Z"
            fill="url(#warmCloudGrad)"
          />
          <path
            d="M820,760 Q1260,665 1810,715 Q1520,830 1120,818 Q920,808 820,760 Z"
            fill="#271e29"
            opacity="0.92"
          />
          <path
            d="M0,885 Q235,842 520,865 Q365,912 150,920 L0,912 Z"
            fill="#473641"
            opacity="0.9"
          />
        </g>

        {/* 底部远古祭坛黑岩剪影与暗角 */}
        <path
          d="M0,1080 L0,985 L180,1015 L360,1045 L620,1065 L1340,1060 L1680,1020 L1920,975 L1920,1080 Z"
          fill="#0b090f"
          opacity="0.88"
        />
      </svg>

      {/* 4. 全屏浮动黄金余烬 + 幽蓝魂火粒子画布 */}
      <ParticleCanvas theme={isTitle ? 'spire_title' : 'ember'} />

      {/* 5. 当作为子界面背景时，叠加一层高对比度暗角遮罩，保证前景UI与文字清晰锐利 */}
      {!isTitle && (
        <div
          className="absolute inset-0"
          style={{
            background: isMap
              ? 'radial-gradient(circle at 50% 45%, rgba(12, 16, 23, 0.35) 0%, rgba(8, 11, 16, 0.82) 100%)'
              : 'radial-gradient(circle at 50% 35%, rgba(14, 18, 26, 0.52) 0%, rgba(8, 10, 16, 0.88) 100%)',
          }}
        />
      )}
    </div>
  );
};


// ============================================================================
// High-Detail 16x16 Multi-Shaded Card Pixel Sprites
// ============================================================================
const CARD_SPRITES: Record<string, { grid: string[]; palette: Record<string, string> }> = {
  sword: {
    palette: {
      K: '#020617',
      W: '#F8FAFC',
      L: '#CBD5E1',
      S: '#64748B',
      Y: '#FDE047',
      G: '#D97706',
      B: '#78350F',
      R: '#EF4444',
    },
    grid: [
      '...........KKKK.',
      '..........KWWLK.',
      '.........KWWLSK.',
      '........KWWLSK..',
      '.......KWWLSK...',
      '......KWWLSK....',
      '.....KWWLSK.....',
      '..KK.KWWLSK.....',
      '..KYYKWWLSK.....',
      '...KYYYYGK......',
      '....KGGGGKK.....',
      '...KBBKYGGYK....',
      '..KBBK..KKK.....',
      '.KRRK...........',
      '.KKK............',
      '................',
    ],
  },
  heavy_blade: {
    palette: {
      K: '#090D16',
      W: '#FEF2F2',
      Y: '#FDE047',
      O: '#F97316',
      R: '#DC2626',
      D: '#7F1D1D',
      G: '#B45309',
      S: '#475569',
    },
    grid: [
      '.........KKKKKK.',
      '........KWWWWWWK',
      '.......KWWYYYYRK',
      '......KWWYYOORRK',
      '.....KWWYYOORRDK',
      '....KWWYYOORRDDK',
      '...KWWYYOORRDDK.',
      '..KYYYYOORRDDK..',
      '..KGGGGORRDDK...',
      '..KGGGGGGGGK....',
      '.KSSKGGGGKK.....',
      'KSSK..KKKK......',
      'KKK.............',
      '................',
      '................',
      '................',
    ],
  },
  whirlwind: {
    palette: {
      K: '#020617',
      W: '#F8FAFC',
      C: '#E2E8F0',
      R: '#EF4444',
      O: '#F97316',
      Y: '#FDE047',
    },
    grid: [
      '....KKKKKKKK....',
      '..KKWWWWWWWWKK..',
      '.KWWCCCCCCCCWWK.',
      'KWCCRRRRRRRRCCWK',
      'KWCROOOOOOOORCWK',
      '..KKYYYYYYYYKK..',
      '....KKWWWWKK....',
      '..KKWWCCCCWWKK..',
      '.KWCCRRRRRRCCWK.',
      'KWCROOOOOOOORCWK',
      '.KWWYYYYYYYYWWK.',
      '...KKWWWWWWKK...',
      '.....KKKKKK.....',
      '....KROOOORK....',
      '.....KKKKKK.....',
      '................',
    ],
  },
  shield: {
    palette: {
      K: '#020617',
      Y: '#FDE047',
      G: '#D97706',
      W: '#EFF6FF',
      L: '#60A5FA',
      B: '#2563EB',
      D: '#1E3A8A',
    },
    grid: [
      '..KKKKKKKKKKKK..',
      '.KYYYYYYYYYYYYK.',
      '.KYLLLLLLLLLLYK.',
      '.KYLBWWWWWWBLYK.',
      '.KYLBWLLLLWBLYK.',
      '.KYLBWLYYLWBLYK.',
      '.KYLBWLYYLWBLYK.',
      '.KYLBBBBBBBBBYK.',
      '..KYLBBBBBBBYK..',
      '..KGDBBBBBBBDK..',
      '...KGDBBBBBDK...',
      '....KGDDDDDK....',
      '.....KGGGGK.....',
      '......KKKK......',
      '................',
      '................',
    ],
  },
  shield_slam: {
    palette: {
      K: '#020617',
      Y: '#FACC15',
      O: '#F97316',
      W: '#F8FAFC',
      L: '#38BDF8',
      B: '#0284C7',
      R: '#EF4444',
    },
    grid: [
      '.Y..KKKKKKKK..Y.',
      '..OKYYYYYYYYKO..',
      '.R.KYLLLLLLYK.R.',
      '...KYLWWWWLYK...',
      'Y..KYLWYYWLYK..Y',
      '.O.KYLWYYWLYK.O.',
      '...KYLBBBBBYK...',
      '..R.KYBBBBYK.R..',
      '....KOBBBBOK....',
      '..Y..KOBBOK..Y..',
      '......KOOOK.....',
      '.......KKK......',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  iron_fortress: {
    palette: {
      K: '#020617',
      W: '#E2E8F0',
      L: '#94A3B8',
      S: '#475569',
      D: '#1E293B',
      Y: '#FACC15',
    },
    grid: [
      '.KKK..KKKK..KKK.',
      '.KWK..KWWK..KWK.',
      '.KWWWWWWWWWWWWK.',
      '.KLLLLLLLLLLLLK.',
      '..KSSSSSSSSSSK..',
      '..KSLLYYYYLLSK..',
      '..KSLYWWWWYLSK..',
      '..KSLYWWWWYLSK..',
      '..KSLLYYYYLLSK..',
      '.KSSSSSSSSSSSSK.',
      '.KDDDDDDDDDDDDK.',
      '.KDDDDKKKKDDDDK.',
      '.KKKKK....KKKKK.',
      '................',
      '................',
      '................',
    ],
  },
  war_banner: {
    palette: {
      K: '#020617',
      Y: '#FDE047',
      G: '#D97706',
      R: '#DC2626',
      D: '#991B1B',
      W: '#FEF2F2',
    },
    grid: [
      '.......KK.......',
      '..KKKKKKKKKKKK..',
      '.KYYYYYYYYYYYYK.',
      '..KRRRRRRRRRRK..',
      '..KRWWYYYYWWRK..',
      '..KRWYYYYYYWRK..',
      '..KRRRRYYRRRRK..',
      '..KDDDDYYDDDDK..',
      '..KDDDDDDDDDDK..',
      '..KDDD.KK.DDDK..',
      '..KDD..KK..DDK..',
      '..KK...KK...KK..',
      '.......KK.......',
      '......KGGK......',
      '......KKKK......',
      '................',
    ],
  },
  demon_crown: {
    palette: {
      K: '#090D16',
      R: '#EF4444',
      D: '#7F1D1D',
      O: '#F97316',
      Y: '#FDE047',
      W: '#FEF9C3',
    },
    grid: [
      '.KK..........KK.',
      'KYYK........KYYK',
      'KYYYK..KK..KYYYK',
      '.KOOYK.KRK.KOOYK',
      '..KORRKKRKKRROK.',
      '..KRRRRRRRRRRK..',
      '..KRRWWRRWWRRK..',
      '..KRRYYRRYYRRK..',
      '..KDDDDDDDDDDK..',
      '...KDRRRRRRDK...',
      '....KDDDDDDK....',
      '.....KKKKKK.....',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  fireball: {
    palette: {
      R: '#B91C1C',
      F: '#EF4444',
      O: '#F97316',
      Y: '#FACC15',
      W: '#FEF9C3',
    },
    grid: [
      '......R...R.....',
      '....R.FR.RF.....',
      '...RFFOOOOFFR...',
      '..RFFOOOOOOFFR..',
      '.RFFOOYYYYOOFFR.',
      '.RFOOYYWWYYOOFR.',
      'RFFOYYWWWWYYOFFR',
      'RFFOYYWWWWYYOFFR',
      'RFFOYYWWWWYYOFFR',
      '.RFOOYYWWYYOOFR.',
      '.RFFOOYYYYOOFFR.',
      '..RFFOOOOOOFFR..',
      '...RFFFFFFFFR...',
      '.....RRRRRR.....',
      '................',
      '................',
    ],
  },
  frost: {
    palette: {
      D: '#0369A1',
      B: '#06B6D4',
      L: '#67E8F9',
      W: '#F0FDFA',
    },
    grid: [
      '.......WW.......',
      '....B..WW..B....',
      '..B..L.LL.L..B..',
      '...B.LWWWWL.B...',
      '....BLWWWWLB....',
      '..LLWWWWWWWWLL..',
      'WWLLLWWWWWWLLLWW',
      'WWLLLWWWWWWLLLWW',
      '..LLWWWWWWWWLL..',
      '....BLWWWWLB....',
      '...B.LWWWWL.B...',
      '..B..L.LL.L..B..',
      '....B..WW..B....',
      '.......WW.......',
      '................',
      '................',
    ],
  },
  glacier_crystal: {
    palette: {
      K: '#082F49',
      D: '#0284C7',
      B: '#38BDF8',
      L: '#BAE6FD',
      W: '#F8FAFC',
    },
    grid: [
      '.......KK.......',
      '......KWWK......',
      '.....KWLLWK.....',
      '....KWLLLLWK....',
      '..KKWLLBBLLWKK..',
      '.KWWLLBBBBLLWWK.',
      '.KWLBBBBBBBBLWK.',
      '.KBBBBDDDDDBBBK.',
      '..KBBDDDDDDDBK..',
      '...KBDDDDDDDK...',
      '....KDDDDDDK....',
      '.....KDDDDK.....',
      '......KKKK......',
      '................',
      '................',
      '................',
    ],
  },
  lightning: {
    palette: {
      K: '#451A03',
      O: '#EA580C',
      Y: '#FACC15',
      W: '#FEFCE8',
    },
    grid: [
      '........KKKKKK..',
      '.......KYYYYWK..',
      '......KYYWWYK...',
      '.....KYYWWYK....',
      '....KYYWWYK.....',
      '...KYYYYYYYYYYK.',
      '...KKKKOYYWWWK..',
      '......KOYYWWK...',
      '.....KOYYWYK....',
      '....KOYYWYK.....',
      '...KOYYWYK......',
      '..KOYYOK........',
      '..KOOK..........',
      '................',
      '................',
      '................',
    ],
  },
  meteor_star: {
    palette: {
      K: '#1E1B4B',
      P: '#9333EA',
      R: '#EF4444',
      O: '#F97316',
      Y: '#FDE047',
      W: '#FFFFFF',
    },
    grid: [
      '..........P.R...',
      '.........PPROR..',
      '........PRROYYR.',
      '......KKROOYYYW.',
      '.....KPPPOYYYYO.',
      '....KPPPPOOOOO..',
      '...KPPYYWWYYPPK.',
      '..KPPYYWWWWYYPPK',
      '..KPPYYWWWWYYPPK',
      '...KPPYYWWYYPPK.',
      '....KPPPPPPPPK..',
      '.....KKKKKKKK...',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  black_hole: {
    palette: {
      K: '#020617',
      D: '#3B0764',
      P: '#9333EA',
      L: '#C084FC',
      C: '#38BDF8',
      W: '#F8FAFC',
    },
    grid: [
      '....PPPPPPPP....',
      '..PPLLLLLLLLPP..',
      '.PLDDDDDDDDDDLP.',
      'PLDKKKKKKKKKKDLP',
      'PLDKCCCCCCCCKDLP',
      'PLDKCWWWWWWCKDLP',
      'PLDKCWKKKKWCKDLP',
      'PLDKCWKKKKWCKDLP',
      'PLDKCWWWWWWCKDLP',
      'PLDKCCCCCCCCKDLP',
      'PLDKKKKKKKKKKDLP',
      '.PLDDDDDDDDDDLP.',
      '..PPLLLLLLLLPP..',
      '....PPPPPPPP....',
      '................',
      '................',
    ],
  },
  arcane_eye: {
    palette: {
      K: '#090D16',
      P: '#7E22CE',
      C: '#22D3EE',
      W: '#ECFEFF',
      Y: '#FACC15',
    },
    grid: [
      '......YYYY......',
      '...KKKPPPPKKK...',
      '.KKPPPPPPPPPPKK.',
      'KPPCCCCCCCCCCPPK',
      'KPCWWWWWWWWWWCPK',
      'KPCWCCCCCCCCWCPK',
      'KPCWCCYYYYCCWCPK',
      'KPCWCCYKKYCCWCPK',
      'KPCWCCYYYYCCWCPK',
      'KPCWCCCCCCCCWCPK',
      'KPCWWWWWWWWWWCPK',
      'KPPCCCCCCCCCCPPK',
      '.KKPPPPPPPPPPKK.',
      '...KKKPPPPKKK...',
      '......YYYY......',
      '................',
    ],
  },
  dagger: {
    palette: {
      K: '#022C22',
      W: '#ECFDF5',
      G: '#10B981',
      E: '#059669',
      P: '#A855F7',
      D: '#334155',
    },
    grid: [
      '...........KKKK.',
      '..........KWWGK.',
      '.........KWWGEK.',
      '........KWWGEK..',
      '.......KWWGEK...',
      '......KWWGEK....',
      '....KKPPGEK.....',
      '....KPPPPPK.....',
      '.....KPPPPK.....',
      '....KDDKPPK.....',
      '...KDDK.KK......',
      '..KPPK..........',
      '..KKK...........',
      '................',
      '................',
      '................',
    ],
  },
  fan_of_knives: {
    palette: {
      K: '#020617',
      W: '#F8FAFC',
      C: '#94A3B8',
      G: '#10B981',
      Y: '#FACC15',
    },
    grid: [
      '.KK....KK....KK.',
      'KWWK..KWWK..KWWK',
      'KWCW..KWWK..KWCW',
      '.KWCW.KWWK.KWCW.',
      '..KWCWKWWKKWCW..',
      '...KGGGGGGGGK...',
      '....KYYYYYYK....',
      '.....KKKKKK.....',
      '......KYYK......',
      '......KKKK......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  shuriken: {
    palette: {
      K: '#020617',
      W: '#F8FAFC',
      L: '#38BDF8',
      S: '#64748B',
      Y: '#FACC15',
    },
    grid: [
      '.......KK.......',
      '......KWWK......',
      '.....KWWLSK.....',
      '.....KWLSK......',
      '.KKKKKWLSSKKKKK.',
      'KWWWWWWYYWWWWWWK',
      '.KSSSSYYWWSSSSK.',
      '.....KSLWK......',
      '....KSLWWK......',
      '.....KWWK.......',
      '......KK........',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  poison: {
    palette: {
      K: '#052E16',
      W: '#DCFCE7',
      L: '#4ADE80',
      G: '#16A34A',
      P: '#9333EA',
      D: '#581C87',
    },
    grid: [
      '.....KKKKKK.....',
      '.....KLLLLK.....',
      '.....KGGGGK.....',
      '....KKWWWWKK....',
      '...KGGGGGGGGK...',
      '..KGGLLLLLLGGK..',
      '.KGGLLWWWWLLGGK.',
      '.KGGLWPPPPWLGGK.',
      '.KGGLPPPPPPGLGK.',
      '.KGGGPPDDPPGGGK.',
      '.KGGGGGGGGGGGGK.',
      '..KGGGGGGGGGGK..',
      '...KKKKKKKKKK...',
      '................',
      '................',
      '................',
    ],
  },
  venom_skull: {
    palette: {
      K: '#052E16',
      G: '#22C55E',
      L: '#86EFAC',
      P: '#9333EA',
      Y: '#FDE047',
    },
    grid: [
      '....KKKKKKKK....',
      '..KKLLLLLLLLKK..',
      '.KLLGGGGGGGGLLK.',
      '.KLGGKKGGKKGGLK.',
      '.KLGKYYKKYYKGLK.',
      '.KLGGKKGGKKGGLK.',
      '..KLLGGKKGGLLK..',
      '...KKGGGGGGKK...',
      '....KGKGGKGK....',
      '....KKKKKKKK....',
      '...P..G..G..P...',
      '......G..G......',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  shadow_cloak: {
    palette: {
      K: '#020617',
      D: '#1E1B4B',
      P: '#6D28D9',
      L: '#A855F7',
      G: '#10B981',
    },
    grid: [
      '.....KKKKKK.....',
      '...KKPPPPPPKK...',
      '..KPPLLLLLLPPK..',
      '.KPLDDDDDDDDLPK.',
      '.KPDKKGKKGKKDPK.',
      '.KPDKGGKKGGKDPK.',
      '.KPLDDDDDDDDLPK.',
      '..KPPPPPPPPPPK..',
      '.KPPDDDDDDDDPPK.',
      'KPPDDDDDDDDDDPPK',
      'KPDDDDDDDDDDDDPK',
      '.KKDDKKDDKKDDKK.',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  blood: {
    palette: {
      K: '#450A0A',
      W: '#FECACA',
      L: '#F87171',
      R: '#DC2626',
      D: '#991B1B',
      Y: '#FACC15',
    },
    grid: [
      '.......KK.......',
      '......KRRK......',
      '.....KRRRRK.....',
      '....KRWLRRRK....',
      '...KRWWLRRRRK...',
      '..KRWWLRRRRRRK..',
      '.KRRRRRRRRRRRRK.',
      '.KRRRRYYYYRRRRK.',
      '.KRRRYWWWWYRRRK.',
      '.KRRRRYYYYRRRRK.',
      '..KRRRRDDDDDRK..',
      '...KDDDDDDDDK...',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
    ],
  },
  scroll: {
    palette: {
      K: '#451A03',
      B: '#92400E',
      Y: '#FEF3C7',
      G: '#F59E0B',
      R: '#EF4444',
    },
    grid: [
      '..KKKKKKKKKKKK..',
      '.KBBBBBBBBBBBBK.',
      '.KYYYYYYYYYYYYK.',
      '..KYRRRRRRRRYY..',
      '..KYYYYYYYYYYY..',
      '..KYGGGGGGGGYY..',
      '..KYYYYYYYYYYY..',
      '..KYGGGGGGGGYY..',
      '..KYYYYYYYYYYY..',
      '..KYRRRRRRRRYY..',
      '.KYYYYYYYYYYYYK.',
      '.KBBBBBBBBBBBBK.',
      '..KKKKKKKKKKKK..',
      '................',
      '................',
      '................',
    ],
  },
  holy_grail: {
    palette: {
      K: '#451A03',
      Y: '#FDE047',
      G: '#D97706',
      R: '#EF4444',
      W: '#FFFFFF',
    },
    grid: [
      '...KKKKKKKKKK...',
      '..KYYYYYYYYYYK..',
      '..KYWWRRRRWWYK..',
      '..KYYYYYYYYYYK..',
      '...KYYGGGGYYK...',
      '....KGGGGGGK....',
      '.....KYYYYK.....',
      '......KGGK......',
      '......KYYK......',
      '....KKYYYYKK....',
      '...KGGGGGGGGK...',
      '...KKKKKKKKKK...',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  // ============================================================================
  // Bespoke Card-by-Card Unique Pixel Art Illustrations (0% Duplicate Sprites!)
  // ============================================================================
  // --- Token: 飞刀 (Shiv) ---
  shiv: {
    palette: { K: '#020617', W: '#F8FAFC', C: '#38BDF8', S: '#94A3B8', R: '#EF4444', Y: '#FACC15' },
    grid: [
      '............KKK.',
      '...........KWWCK',
      '..........KWWCSK',
      '.........KWWCSK.',
      '........KWWCSK..',
      '.......KWWCSK...',
      '......KYYCSK....',
      '.....KYYYYK.....',
      '....KRRKKK......',
      '...KRRK.........',
      '..KRRK..........',
      '.KR.R...........',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 打击 (Strike) ---
  w_strike: {
    palette: { K: '#020617', W: '#F8FAFC', L: '#CBD5E1', S: '#64748B', Y: '#FDE047', G: '#D97706', R: '#EF4444' },
    grid: [
      '...........KKKK.',
      '..........KWWLK.',
      '.........KWWLSK.',
      '........KWWLSK..',
      '.......KWWLSK...',
      '......KWWLSK....',
      '.....KWWLSK.....',
      '..KK.KWWLSK.....',
      '..KYYKWWLSK.....',
      '...KYYYYGK......',
      '....KGGGGKK.....',
      '...KRRKYGGYK....',
      '..KRRK..KKK.....',
      '.KYYK...........',
      '.KKK............',
      '................',
    ],
  },
  // --- Warrior: 防御 (Defend) ---
  w_defend: {
    palette: { K: '#020617', Y: '#FDE047', G: '#D97706', W: '#EFF6FF', L: '#60A5FA', B: '#2563EB', D: '#1E3A8A' },
    grid: [
      '..KKKKKKKKKKKK..',
      '.KYYYYYYYYYYYYK.',
      '.KYLLLLLLLLLLYK.',
      '.KYLBWWWWWWBLYK.',
      '.KYLBWLLLLWBLYK.',
      '.KYLBWLYYLWBLYK.',
      '.KYLBWLYYLWBLYK.',
      '.KYLBBBBBBBBBYK.',
      '..KYLBBBBBBBYK..',
      '..KGDBBBBBBBDK..',
      '...KGDBBBBBDK...',
      '....KGDDDDDK....',
      '.....KGGGGK.....',
      '......KKKK......',
      '................',
      '................',
    ],
  },
  // --- Warrior: 痛击 (Bash - Armor-Crushing Spiked Mace + Vulnerable Crack) ---
  w_bash: {
    palette: { K: '#090D16', W: '#F8FAFC', S: '#94A3B8', D: '#475569', P: '#E879F9', R: '#EF4444', Y: '#FACC15', B: '#78350F' },
    grid: [
      '....P..KK..P....',
      '..K..KKWWKK..K..',
      '.KWKKSSSSSSKKWK.',
      '..KSSWWYYWWSSK..',
      '.KSSSWYYYYWSSSK.',
      'KWSSDDYYYYDDSSWK',
      '.KSSDDDDDDDDSSK.',
      '..KKSSDDDDSSKK..',
      '...P.KKBBKK.P...',
      '......KBBK......',
      '.....KBBBBK.....',
      '....KBBK.RR.....',
      '...KBBK.........',
      '..KYYK..........',
      '..KKK...........',
      '................',
    ],
  },
  // --- Warrior: 铁斩波 (Iron Wave - Shield + Crescent Sonic Wave) ---
  w_iron_wave: {
    palette: { K: '#020617', B: '#38BDF8', D: '#0284C7', Y: '#FDE047', O: '#F97316', W: '#FFFFFF' },
    grid: [
      '.........YYYY...',
      '..KKKKK....YYWO.',
      '.KBBBBBK....YYWO',
      'KBBWWWBBK....YWO',
      'KBWDDDWBBK...YWO',
      'KBWDDDWBBK...YWO',
      'KBBWWWBBK....YWO',
      '.KBBBBBK....YYWO',
      '..KDDDK....YYWO.',
      '...KKK...YYYY...',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 顺劈斩 (Cleave - Wide Horizontal Crimson Crescent) ---
  w_cleave: {
    palette: { K: '#090D16', W: '#FFFFFF', Y: '#FEF08A', O: '#F97316', R: '#EF4444', D: '#991B1B' },
    grid: [
      '................',
      '....KKKKKKKK....',
      '..KKRRRRRRRRKK..',
      '.KRROOOOOOOORRK.',
      'KROYYYYYYYYYYORK',
      'KRYWWWWWWWWWWYRK',
      'KRWKKKKKKKKKKWRK',
      'KDW..........WDK',
      '.KK..........KK.',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 疾风双斩 (Twin Strike - Crossed Dual Glowing Blades) ---
  w_twin_strike: {
    palette: { K: '#020617', W: '#F8FAFC', C: '#38BDF8', R: '#EF4444', Y: '#FACC15', G: '#D97706' },
    grid: [
      '.KKK........KKK.',
      'KWWCK......KRWWK',
      '.KWWCK....KRWWK.',
      '..KWWCK..KRWWK..',
      '...KWWCKKRWWK...',
      '....KWWWWWWK....',
      '....KWWYYWWK....',
      '...KRWWKKWWCK...',
      '..KRWWK..KWWCK..',
      '.KYYGK....KGYYK.',
      'KGGK........KGGK',
      'KKK..........KKK',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 剑气护体 (Sword Aura - Orbiting Spirit Swords + Barrier) ---
  w_sword_aura: {
    palette: { K: '#020617', Y: '#FDE047', O: '#F97316', C: '#38BDF8', W: '#FFFFFF' },
    grid: [
      '..W....WW....W..',
      '.YYY..YWWY..YYY.',
      '.YOY..YOOY..YOY.',
      '.YOY.CCCCCC.YOY.',
      '.YOYCCWWWWCCYOY.',
      '..K.CWWYYWWC.K..',
      '....CWYYYYWC....',
      '....CWWYYWWC....',
      '....CCWWWWCC....',
      '.....CCCCCC.....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 耸肩无视 (Shrug It Off - Spiked Steel Pauldron Deflecting) ---
  w_shrug: {
    palette: { K: '#020617', W: '#F8FAFC', L: '#94A3B8', S: '#475569', Y: '#FACC15', C: '#38BDF8' },
    grid: [
      '..Y..........Y..',
      '.YY..KKKKKK..YY.',
      '..K.KLLLLLLK.K..',
      '.KLKLLWWWWLLKLK.',
      'KLLLLWSSSSWLLLLK',
      'KLLSSSSSSSSSSLLK',
      'KLSSKYYYYYYKSSLK',
      '.KSSCCCCCCCCSSK.',
      '..KKKKKKKKKKKK..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 全身撞击 (Body Slam - Charging Armored Shield Impact) ---
  w_body_slam: {
    palette: { K: '#020617', W: '#FFFFFF', C: '#38BDF8', B: '#0284C7', Y: '#FACC15', O: '#F97316', R: '#EF4444' },
    grid: [
      '.......YYOR.....',
      '..KKKKK.YYOR....',
      '.KCCCCCK.YYOR...',
      'KCCWWWCCK.YYOR..',
      'KCWBBBWCCK.YYOR.',
      'KCWBBBWCCK.YYOR.',
      'KCCWWWCCK.YYOR..',
      '.KCCCCCK.YYOR...',
      '..KKKKK.YYOR....',
      '.......YYOR.....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 万剑归宗 (Sword Storm - Rain of Celestial Greatswords) ---
  w_sword_storm: {
    palette: { K: '#090D16', W: '#FFFFFF', Y: '#FDE047', O: '#F97316', R: '#EF4444' },
    grid: [
      '.YY....YY....YY.',
      '.OO....OO....OO.',
      '.WW.YY.WW.YY.WW.',
      '.WW.OO.WW.OO.WW.',
      '.WW.WW.WW.WW.WW.',
      '.RR.WW.RR.WW.RR.',
      '..R.WW..R.WW..R.',
      '....RR....RR....',
      '....R.....R.....',
      '..YYYYYYYYYYYY..',
      '...OOOOOOOOOO...',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 血祭狂暴 (Bloodletting - Ritual Sacrifice Chalice & Blood Surge) ---
  w_bloodletting: {
    palette: { K: '#450A0A', R: '#EF4444', D: '#991B1B', W: '#FECACA', Y: '#FACC15' },
    grid: [
      '....R......R....',
      '...RWR....RWR...',
      '...RRR.RR.RRR...',
      '......RYYR......',
      '...KKKRRRRKKK...',
      '..KRRRRRRRRRRK..',
      '..KRWWDDDDWWRK..',
      '...KDDDDDDDDK...',
      '....KKRRRRKK....',
      '......KDDK......',
      '....KKYYYYKK....',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 旋风烈斩 (Whirlwind - Blazing Triple Cyclone of Blades) ---
  w_whirlwind: {
    palette: { K: '#020617', W: '#F8FAFC', C: '#E2E8F0', R: '#EF4444', O: '#F97316', Y: '#FDE047' },
    grid: [
      '..KKKKKKKKKKKK..',
      '.KWWWWWWWWWWWWK.',
      'KWCCRRRRRRRRCCWK',
      '.KKOOOOOOOOOOKK.',
      '...KKYYYYYYKK...',
      '..KKWWWWWWWWKK..',
      '.KWCCRRRRRRCCWK.',
      '..KKOOOOOOOOKK..',
      '....KKYYYYKK....',
      '...KKWWWWWWKK...',
      '....KRRRRRRK....',
      '.....KOOOOK.....',
      '......KKKK......',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 燃烧战意 (Inflame - Roaring Flame Gauntlet Fist) ---
  w_inflame: {
    palette: { K: '#450A0A', R: '#EF4444', O: '#F97316', Y: '#FDE047', W: '#FFFFFF', S: '#94A3B8' },
    grid: [
      '....R..O..R.....',
      '...ROR.YO.ROR...',
      '..ROOYYWWYYOOR..',
      '.ROOYWWWWWWYOOR.',
      '.ROYWWKKKKWWYOR.',
      '.ROYWKSSSSKWYOR.',
      '..OYWKSSSSKWYO..',
      '...YYKSSSSKYY...',
      '....KKSSSSKK....',
      '.....KKKKKK.....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 固若金汤 (Entrench - Double Reinforced Golden Bastion Shield) ---
  w_entrench: {
    palette: { K: '#020617', Y: '#FDE047', G: '#D97706', C: '#38BDF8', B: '#0284C7', W: '#FFFFFF' },
    grid: [
      '.KKKK......KKKK.',
      'KYYYYKKKKKKYYYYK',
      'KYGGGGYYYYGGGGYK',
      'KYGCCCCCCCCCCGYK',
      'KYGCWWWWWWWWCGYK',
      'KYGCWBBBBBBWCGYK',
      'KYGCWBYYYYBWCGYK',
      'KYGCWBBBBBBWCGYK',
      '.KYGCCCCCCCCGYK.',
      '..KYGGGGGGGGYK..',
      '...KYYYYYYYYK...',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 突破极限 (Limit Break - Shattering Chains & Super Saiyan Golden Aura) ---
  w_limit_break: {
    palette: { K: '#090D16', Y: '#FDE047', O: '#F97316', R: '#EF4444', W: '#FFFFFF', S: '#94A3B8' },
    grid: [
      '..Y...RRRR...Y..',
      '.YY..ROOOOR..YY.',
      '..Y.ROYYYYOR.Y..',
      'SS.ROYWWWWYOR.SS',
      '.SSOYWKKKKWYOSS.',
      '...OYWKWWKWYO...',
      '.SSOYWKKKKWYOSS.',
      'SS.ROYWWWWYOR.SS',
      '..Y.ROYYYYOR.Y..',
      '.YY..ROOOOR..YY.',
      '..Y...RRRR...Y..',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 钢铁壁垒 (Barricade - Impenetrable Gothic Fortress Wall) ---
  w_barricade: {
    palette: { K: '#020617', W: '#E2E8F0', L: '#94A3B8', S: '#475569', C: '#38BDF8', Y: '#FACC15' },
    grid: [
      'KKK..KKKKKK..KKK',
      'KLLKKLLLLLLKKLLK',
      'KLLLLLLLLLLLLLLK',
      'KSSSSCCCCCCSSSSK',
      'KSSCCWWWWWWCCSSK',
      'KSSCWYYYYYYWCSSK',
      'KSSCWYCCCCYWCSSK',
      'KSSCWYYYYYYWCSSK',
      'KSSCCWWWWWWCCSSK',
      'KSSSSSSSSSSSSSSK',
      'KKKKKKKKKKKKKKKK',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 剑神降临 (Sword God - Winged Divine Halo Greatsword) ---
  w_sword_god: {
    palette: { K: '#451A03', Y: '#FDE047', O: '#F97316', W: '#FFFFFF', R: '#EF4444' },
    grid: [
      '......KKKK......',
      '..YY.KWWWWK.YY..',
      '.YYY.KWYYWK.YYY.',
      'YYYYOKWYYWKOYYYY',
      '.YYOOKWYYWKOOYY.',
      '..OO.KWWWWK.OO..',
      '....RRRRRRRR....',
      '.....KYYYYK.....',
      '......KRRK......',
      '......KYYK......',
      '......KKKK......',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 嗜血斩 (Blood Slash - Vampiric Crimson Fang Blade) ---
  w_blood_slash: {
    palette: { K: '#450A0A', R: '#EF4444', D: '#991B1B', W: '#FECACA', Y: '#FACC15' },
    grid: [
      '..........KKKKK.',
      '.........KRRRRRK',
      '........KRWWWRRK',
      '.......KRWWRRRK.',
      '......KRWWRRRK..',
      '.....KRWWRRRK...',
      '..KK.KRWRRRK....',
      '..KYYKRRRRK.R...',
      '...KYYYYDDK.RR..',
      '....KDDDDDKK....',
      '...KRRK..KK.....',
      '..KRRK..........',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 重锤粉碎 (Bludgeon - Colossal Volcanic Warhammer) ---
  w_bludgeon: {
    palette: { K: '#090D16', R: '#EF4444', O: '#F97316', Y: '#FDE047', S: '#64748B', D: '#334155', B: '#78350F' },
    grid: [
      '..KKKKKKKKKKKK..',
      '.KSSSSSSSSSSSSK.',
      'KSSRRRRRRRRRRSSK',
      'KSRROOOOOOOORRSK',
      'KSROYYYYYYYYORSK',
      'KSRROOOOOOOORRSK',
      'KSSDDDDDDDDDDSSK',
      '.KKKKKKKKKKKKKK.',
      '......KBBK......',
      '......KBBK......',
      '......KBBK......',
      '.....KYYYYK.....',
      '.....KKKKKK.....',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 活动肌肉 (Flex - Glowing Muscular Arm + Power Sparks) ---
  w_flex: {
    palette: { K: '#450A0A', R: '#EF4444', O: '#F97316', Y: '#FDE047', W: '#FEF08A' },
    grid: [
      '..Y....KKK....Y.',
      '.YY...KRRRK..YY.',
      '.....KROOORK....',
      '....KROYYORK....',
      '..KK.KRRRRK.....',
      '.KRRKKROOORK....',
      'KROOOORYYYYORK..',
      'KROYYYYWWWWYORK.',
      '.KROOOOOOOOORK..',
      '..KKKKKKKKKKK...',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 千钧重刃 (Heavy Blade - 5x Strength Colossal Greatsword) ---
  w_heavy_blade: {
    palette: { K: '#090D16', W: '#FEF2F2', Y: '#FDE047', O: '#F97316', R: '#DC2626', D: '#7F1D1D', G: '#B45309' },
    grid: [
      '........KKKKKKK.',
      '.......KWWWWWWWK',
      '......KWWYYYYRRK',
      '.....KWWYYOORRRK',
      '....KWWYYOORRDDK',
      '...KWWYYOORRDDK.',
      '..KYYYYOORRDDK..',
      '..KGGGGORRDDK...',
      '..KGGGGGGGGK....',
      '.KRRKGGGGKK.....',
      'KRRK..KKKK......',
      'KKK.............',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 无惧疼痛 (Feel No Pain - Stoic Iron Visor in Soul Fire) ---
  w_feel_no_pain: {
    palette: { K: '#020617', C: '#38BDF8', W: '#F8FAFC', S: '#94A3B8', D: '#475569', Y: '#FACC15' },
    grid: [
      '..C...KKKK...C..',
      '.CC.KKSSSSKK.CC.',
      'C..KSSLLLLSSK..C',
      '..KSSLWWWWLSSK..',
      '..KSSKKKKKKSSK..',
      '..KSKCCCCCCKSK..',
      '..KSSDDDDDDSSK..',
      '..KSSDKSSKDSSK..',
      '...KSSDKDKSSK...',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 黑暗之拥 (Dark Embrace - Abyssal Shadow Hands & Core) ---
  w_dark_embrace: {
    palette: { K: '#020617', P: '#9333EA', L: '#E879F9', D: '#3B0764', R: '#EF4444', Y: '#FDE047' },
    grid: [
      '.PP..........PP.',
      'PLLP........PLLP',
      'PDDLP..KK..PLDDP',
      '.PDDLPKRRKPLDDP.',
      '..PDDLRYYRLDDP..',
      '..PDDLRYYRLDDP..',
      '...PDDKKKKDDP...',
      '....PPPPPPPP....',
      '.....DDDDDD.....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 重振精神 (Second Wind - Swirling Wind & Winged Shield) ---
  w_second_wind: {
    palette: { K: '#064E3B', G: '#10B981', L: '#6EE7B7', C: '#38BDF8', W: '#FFFFFF', Y: '#FACC15' },
    grid: [
      '....CCCCCCCC....',
      '..CCWWWWWWWWCC..',
      '.CWWGGGGGGGGWWC.',
      'CWGGLLLLLLLLGGWC',
      'CWGLWWYYYYWWLGWC',
      '.CGLWYYYYYYWLGC.',
      '..GLGGYYYYGGLG..',
      '...GGGGGGGGGG...',
      '....CCGGGGCC....',
      '......CCCC......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 恶魔之火 (Fiend Fire - Horned Hellfire Skull Eruption) ---
  w_fiend_fire: {
    palette: { K: '#450A0A', R: '#EF4444', O: '#F97316', Y: '#FDE047', W: '#FFFFFF', P: '#A855F7' },
    grid: [
      '.Y....R..R....Y.',
      'YY...ROOOOR...YY',
      '.YY.ROYYYYOR.YY.',
      '..KKRYYYYYYRKK..',
      '..KRRRRRRRRRRK..',
      '..KRRWWKKWWRRK..',
      '..KRRYYKKYYRRK..',
      '...KRRRRRRRRK...',
      '....KRKRRKRK....',
      '...POOOOOOOOP...',
      '....RRRRRRRR....',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 撕裂血咒 (Rupture - Bursting Crimson Veins Sigil) ---
  w_rupture: {
    palette: { K: '#450A0A', R: '#DC2626', L: '#FCA5A5', Y: '#FACC15', W: '#FFFFFF' },
    grid: [
      '.R.....YY.....R.',
      '..RR...YY...RR..',
      '...RRL.YY.LRR...',
      '....RRRYYRRR....',
      'YYYYRRLWWLRRYYYY',
      '....RRLWWLRR....',
      '...RRRYYYYRRR...',
      '..RRL..YY..LRR..',
      '.RR....YY....RR.',
      'R......YY......R',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 御血狂斩 (Hemokinesis - Crimson Blood Spear & Orbs) ---
  w_hemokinesis: {
    palette: { K: '#450A0A', R: '#EF4444', D: '#991B1B', W: '#FECACA', Y: '#FDE047' },
    grid: [
      '....R......KKKK.',
      '...RWR....KRRWWK',
      '....R....KRRRWWK',
      '........KRRRRWK.',
      '..R....KRRRRK...',
      '.RWR..KRRRRK....',
      '..R..KRRRRK..R..',
      '....KYYYYK..RWR.',
      '...KDDDDK....R..',
      '..KDDDDK........',
      '.KKKKK..........',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 死神收割 (Reaper - Grim Reaper Soul-Harvesting Scythe) ---
  w_reaper: {
    palette: { K: '#1F0404', R: '#EF4444', D: '#991B1B', P: '#C084FC', W: '#FFFFFF', Y: '#FACC15' },
    grid: [
      '....KKKKKKKK....',
      '..KKRRRRRRRRKK..',
      '.KRRWWWWWWWWWRK.',
      'KRRWPPPPPPPPYWRK',
      'KRWPKKKKKKKKYWRK',
      'KRWK........KYRK',
      '.KK.........KYYK',
      '...........KDDK.',
      '..........KDDK..',
      '.........KDDK...',
      '........KDDK....',
      '.......KKKK.....',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  // --- Mage: 奥术飞弹 (Arcane Missiles - Triple Homing Star Bolts) ---
  m_strike: {
    palette: { K: '#1E1B4B', P: '#A855F7', C: '#38BDF8', W: '#FFFFFF', Y: '#FDE047' },
    grid: [
      '..........CCWWY.',
      '.........CCPWWY.',
      '....CCWWY.CCCC..',
      '...CCPWWY.......',
      '....CCCC...CCWWY',
      '..........CCPWWY',
      '...........CCCC.',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 魔力护盾 (Mana Shield - Hexagonal Arcane Forcefield) ---
  m_defend: {
    palette: { K: '#082F49', C: '#22D3EE', B: '#0284C7', P: '#A855F7', W: '#FFFFFF' },
    grid: [
      '....KKKKKKKK....',
      '..KKCCCCCCCCKK..',
      '.KCCWWWWWWWWCCK.',
      'KCCWBBBBBBBBWCCK',
      'KCWBPPWWWWPPBWCK',
      'KCWBPWCCCCWPBWCK',
      'KCWBPWCCCCWPBWCK',
      'KCWBPPWWWWPPBWCK',
      'KCCWBBBBBBBBWCCK',
      '.KCCWWWWWWWWCCK.',
      '..KKCCCCCCCCKK..',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 雷电呼唤 (Zap - Crackling Lightning Orb) ---
  m_zap: {
    palette: { K: '#451A03', O: '#EA580C', Y: '#FACC15', W: '#FEFCE8', C: '#38BDF8' },
    grid: [
      '......YYYY......',
      '...CCKYYYYKCC...',
      '..C.KYYWWYYK.C..',
      '....KYWWWWYK....',
      '..YYKYYWWYYKYY..',
      '....KYYYYYYK....',
      '.....KOYYOK.....',
      '....KOYYOK......',
      '...KOYYOK.......',
      '..KOYYOK........',
      '..KOOK..........',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 烈焰火球 (Fire Bolt - Spiraling Solar Fireball) ---
  m_fire_bolt: {
    palette: { R: '#B91C1C', F: '#EF4444', O: '#F97316', Y: '#FACC15', W: '#FEF9C3' },
    grid: [
      '......R...R.....',
      '....R.FR.RF.....',
      '...RFFOOOOFFR...',
      '..RFFOOOOOOFFR..',
      '.RFFOOYYYYOOFFR.',
      '.RFOOYYWWYYOOFR.',
      'RFFOYYWWWWYYOFFR',
      'RFFOYYWWWWYYOFFR',
      '.RFOOYYWWYYOOFR.',
      '.RFFOOYYYYOOFFR.',
      '..RFFOOOOOOFFR..',
      '...RFFFFFFFFR...',
      '.....RRRRRR.....',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 寒霜新星 (Cold Snap - Six-Pointed Frost Nova Snowflake) ---
  m_cold_snap: {
    palette: { D: '#0369A1', B: '#06B6D4', L: '#67E8F9', W: '#F0FDFA' },
    grid: [
      '.......WW.......',
      '....B..WW..B....',
      '..B..L.LL.L..B..',
      '...B.LWWWWL.B...',
      '....BLWWWWLB....',
      '..LLWWWWWWWWLL..',
      'WWLLLWWWWWWLLLWW',
      'WWLLLWWWWWWLLLWW',
      '..LLWWWWWWWWLL..',
      '....BLWWWWLB....',
      '...B.LWWWWL.B...',
      '..B..L.LL.L..B..',
      '....B..WW..B....',
      '.......WW.......',
      '................',
      '................',
    ],
  },
  // --- Mage: 暗物质凝结 (Dark Orb - Swirling Violet Abyss Sphere) ---
  m_dark_orb: {
    palette: { K: '#020617', D: '#3B0764', P: '#9333EA', L: '#E879F9', C: '#22D3EE', W: '#FFFFFF' },
    grid: [
      '....PPPPPPPP....',
      '..PPLLLLLLLLPP..',
      '.PLDDDDDDDDDDLP.',
      'PLDKKKKKKKKKKDLP',
      'PLDKCCCCCCCCKDLP',
      'PLDKCWWWWWWCKDLP',
      'PLDKCWKKKKWCKDLP',
      'PLDKCWWWWWWCKDLP',
      'PLDKCCCCCCCCKDLP',
      'PLDKKKKKKKKKKDLP',
      '.PLDDDDDDDDDDLP.',
      '..PPLLLLLLLLPP..',
      '....PPPPPPPP....',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 零度射线 (Beam Cell - Laser Prism Piercing Beam) ---
  m_beam_cell: {
    palette: { K: '#082F49', C: '#22D3EE', B: '#0284C7', P: '#C084FC', W: '#FFFFFF' },
    grid: [
      '....KK..........',
      '...KCCK.........',
      '..KCWWCK.PPPPPPP',
      '.KCWWWWCCCCCCCCW',
      'KCCBWWBWWWWWWWWW',
      '.KCWWWWCCCCCCCCW',
      '..KCWWCK.PPPPPPP',
      '...KCCK.........',
      '....KK..........',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 奥术弹幕 (Arcane Barrage - Volley of 6 Star Projectiles) ---
  m_arcane_barrage: {
    palette: { P: '#9333EA', L: '#E879F9', C: '#38BDF8', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '..PLW.....PLW...',
      '.PLWY....PLWY...',
      '..PLW.....PLW...',
      '......CWY....CWY',
      '.....CWYY...CWYY',
      '......CWY....CWY',
      '..PLW.....PLW...',
      '.PLWY....PLWY...',
      '..PLW.....PLW...',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 极寒冰川 (Glacier - Twin Towering Arctic Ice Peaks) ---
  m_glacier: {
    palette: { K: '#082F49', D: '#0284C7', B: '#38BDF8', L: '#BAE6FD', W: '#F8FAFC' },
    grid: [
      '....KK....KK....',
      '...KWWK..KWWK...',
      '..KWLLWKKWLLWK..',
      '.KWLLLLWWLLLLWK.',
      'KWLLBBBBBBBBLLWK',
      'KWLBBBBBBBBBBWLK',
      'KBBBBDDDDDDBBBBK',
      'KBBDDDDDDDDDDBBK',
      'KKKKKKKKKKKKKKKK',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 连锁闪电 (Chain Lightning - Forked Zigzagging Arcs) ---
  m_chain_lightning: {
    palette: { C: '#38BDF8', Y: '#FACC15', O: '#F97316', W: '#FFFFFF' },
    grid: [
      '.YW..........YW.',
      '..YWC......CWY..',
      '...YWCC..CCWY...',
      '....YWWWWWWY....',
      '.....YYYYYY.....',
      '...CCYWOOWYCC...',
      '..CWY..OO..YWC..',
      '.CWY...OO...YWC.',
      'CW.....OO.....WC',
      '.......YY.......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 双重激发 (Dualcast - Twin Linked Infinity Orbs) ---
  m_dualcast: {
    palette: { K: '#090D16', O: '#F97316', Y: '#FDE047', C: '#22D3EE', W: '#FFFFFF' },
    grid: [
      '..OOOO....CCCC..',
      '.OYYYYO..CWWWWC.',
      'OYYWWYYOCWWCCWWC',
      'OYWWWWYYYYCCCCWC',
      'OYYWWYYOCWWCCWWC',
      '.OYYYYO..CWWWWC.',
      '..OOOO....CCCC..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 元素超载引爆 (Arcane Burst - 4-Orb Elemental Nova) ---
  m_arcane_burst: {
    palette: { R: '#EF4444', Y: '#FACC15', C: '#38BDF8', P: '#A855F7', W: '#FFFFFF' },
    grid: [
      '..RRR......CCC..',
      '.RYYYR....CWWWC.',
      '.RYYYR.WW.CWWWC.',
      '..RRR.WWWW.CCC..',
      '.....WWWWWW.....',
      '..PPP.WWWW.YYY..',
      '.PWWWP.WW.YWWWY.',
      '.PWWWP....YWWWY.',
      '..PPP......YYY..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 元素共鸣 (Defragment - Floating Crystal Octahedron) ---
  m_defragment: {
    palette: { K: '#082F49', C: '#06B6D4', L: '#67E8F9', W: '#FFFFFF', Y: '#FDE047' },
    grid: [
      '.......YY.......',
      '......KWWK......',
      '.....KWLLWK.....',
      '..Y.KWLLLLWK.Y..',
      '...KWLLCCLLWK...',
      '..KWLLCWWCLLWK..',
      '...KWLLCCLLWK...',
      '..Y.KCCCCCCK.Y..',
      '.....KCCCCK.....',
      '......KKKK......',
      '.......YY.......',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 奥术涌动 (Turbo - Overclocked Mana Turbine) ---
  m_turbo: {
    palette: { K: '#090D16', C: '#22D3EE', Y: '#FACC15', O: '#F97316', W: '#FFFFFF' },
    grid: [
      '....CCCCCCCC....',
      '..CCYYYYYYYYCC..',
      '.CYOOOOOOOOOOYC.',
      'CYOOWWWWWWWWOOYC',
      'CYOWCCCCCCCCWOYC',
      'CYOWCYYYYYYCWOYC',
      'CYOWCYYYYYYCWOYC',
      'CYOWCCCCCCCCWOYC',
      'CYOOWWWWWWWWOOYC',
      '.CYOOOOOOOOOOYC.',
      '..CCYYYYYYYYCC..',
      '....CCCCCCCC....',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 黑洞坍缩 (Black Hole - Accretion Disk Singularity) ---
  m_black_hole: {
    palette: { K: '#020617', D: '#3B0764', P: '#9333EA', O: '#F97316', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '....PPPPPPPP....',
      '..PPOOOOOOOOPP..',
      '.POYYYYYYYYYYOP.',
      'POYKKKKKKKKKKYOP',
      'POYKWWWWWWWWKYOP',
      'POYKWKKKKKKWKYOP',
      'POYKWKKKKKKWKYOP',
      'POYKWWWWWWWWKYOP',
      'POYKKKKKKKKKKYOP',
      '.POYYYYYYYYYYOP.',
      '..PPOOOOOOOOPP..',
      '....PPPPPPPP....',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 星界魔导核心 (Arcane Core - Golden Astrolabe Star) ---
  m_arcane_core: {
    palette: { K: '#090D16', Y: '#FACC15', G: '#D97706', C: '#22D3EE', W: '#FFFFFF' },
    grid: [
      '......YYYY......',
      '...GGGYYYYGGG...',
      '.GGCCCCCCCCCCGG.',
      'GGCWWWWWWWWWWCGG',
      'GGCWCCCCCCCCWCGG',
      'GGCWCCYYYYCCWCGG',
      'GGCWCCYWWYCCWCGG',
      'GGCWCCYYYYCCWCGG',
      'GGCWCCCCCCCCWCGG',
      'GGCWWWWWWWWWWCGG',
      '.GGCCCCCCCCCCGG.',
      '...GGGYYYYGGG...',
      '......YYYY......',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 星界陨石雨 (Meteor Shower - Triple Blazing Cosmic Meteors) ---
  m_meteor: {
    palette: { K: '#1E1B4B', P: '#9333EA', R: '#EF4444', O: '#F97316', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '......PR..PR....',
      '.....PRO.PRO....',
      '....PROYPROY.PR.',
      '...KOYWKOYW.PRO.',
      '...KWWWKWWWPROY.',
      '....KKK.KKKOYW..',
      '..........KWWW..',
      '...........KKK..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 雷光爪击 (Claw - Triple Neon Cyber-Arcane Dragon Claws) ---
  m_claw: {
    palette: { C: '#22D3EE', B: '#0284C7', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '..YW...YW...YW..',
      '.YWC..YWC..YWC..',
      '.WCB..WCB..WCB..',
      'WCBY.WCBY.WCBY..',
      'CBY..CBY..CBY...',
      'BY...BY...BY....',
      'Y....Y....Y.....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 万物一心 (All For One - Three Zero-Cost Stars Converging) ---
  m_all_for_one: {
    palette: { Y: '#FDE047', O: '#F97316', C: '#38BDF8', P: '#A855F7', W: '#FFFFFF' },
    grid: [
      '.......YY.......',
      '......YWWY......',
      '.......YY.......',
      '.......CC.......',
      '......WWWW......',
      '.YY..WCCCCW..PP.',
      'YWWY.WCWWCW.PWWP',
      '.YY..WCCCCW..PP.',
      '......WWWW......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 弹幕齐射 (Barrage - 4 Orbiting Orbs Firing Beams) ---
  m_barrage: {
    palette: { R: '#EF4444', C: '#38BDF8', Y: '#FACC15', P: '#A855F7', W: '#FFFFFF' },
    grid: [
      '..RR.WWWWWWWWWW.',
      '.RWR............',
      '..RR..CC.WWWWWWW',
      '.....CWC........',
      '......CC........',
      '..YY.WWWWWWWWWW.',
      '.YWY............',
      '..YY..PP.WWWWWWW',
      '.....PWP........',
      '......PP........',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 偏差认知 (Biased Cognition - Golden Clockwork Gear & Eye) ---
  m_biased_cog: {
    palette: { K: '#090D16', Y: '#FACC15', G: '#D97706', C: '#22D3EE', W: '#FFFFFF' },
    grid: [
      '....YY.YY.YY....',
      '..YYGGGGGGGGYY..',
      '.YGGCCCCCCCCGGY.',
      'YGCWWWWWWWWWWCGY',
      'YGCWCCCCCCCCWCGY',
      'YGCWCCYYYYCCWCGY',
      'YGCWCCCCCCCCWCGY',
      'YGCWWWWWWWWWWCGY',
      '.YGGCCCCCCCCGGY.',
      '..YYGGGGGGGGYY..',
      '....YY.YY.YY....',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 循环回路 (Loop - Neon Cyan-Purple Mobius Infinity Loop) ---
  m_loop: {
    palette: { C: '#22D3EE', B: '#0284C7', P: '#A855F7', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '................',
      '..CCCC....PPPP..',
      '.CWWWWC..PWWWWP.',
      'CWCCCCWCPWPPPPWP',
      'CWC..CWYYWC..PWP',
      'CWC..CWYYWC..PWP',
      'CWCCCCWCPWPPPPWP',
      '.CWWWWC..PWWWWP.',
      '..CCCC....PPPP..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 雷暴引擎 (Storm - Dark Thundercloud & Triple Lightning) ---
  m_storm: {
    palette: { K: '#0F172A', S: '#475569', C: '#38BDF8', Y: '#FACC15', W: '#FFFFFF' },
    grid: [
      '....KKKKKKKK....',
      '..KKSSSSSSSSKK..',
      '.KSSCCCCCCCCSSK.',
      'KSSSSSSSSSSSSSSK',
      '.KKKKKKKKKKKKKK.',
      '..YW...YW...YW..',
      '.YW...YW...YW...',
      '..YW...YW...YW..',
      '.YW...YW...YW...',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 双倍能量 (Double Energy - Twin Linked Mana Cores) ---
  m_double_energy: {
    palette: { K: '#082F49', Y: '#FDE047', O: '#F97316', C: '#22D3EE', W: '#FFFFFF' },
    grid: [
      '..KKKK....KKKK..',
      '.KYYYYK..KYYYYK.',
      'KYYWWYYKKYYWWYYK',
      'KYWWWWYYYYWWWWYK',
      'KYWWWWCCCCWWWWYK',
      'KYYWWYYKKYYWWYYK',
      '.KYYYYK..KYYYYK.',
      '..KKKK....KKKK..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 烈焰烙印 (Fire Breath - Blazing Dragon Sigil & Magma Wave) ---
  m_fire_breath: {
    palette: { K: '#450A0A', R: '#EF4444', O: '#F97316', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '..RR........RR..',
      '.ROOR.RRRR.ROOR.',
      '..ROOROOOOOROOR.',
      '...ROOYYYYOOR...',
      '...ROYWWWWYOR...',
      '....RROOOORR....',
      '..RROOYYYYOORR..',
      '.ROOYYWWWWYYOOR.',
      'ROYYWWWWWWWWYYOR',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  // --- Assassin: 迅捷刺击 (Strike - Emerald Assassin Stiletto) ---
  a_strike: {
    palette: { K: '#022C22', W: '#ECFDF5', G: '#10B981', E: '#059669', P: '#A855F7', D: '#334155' },
    grid: [
      '...........KKKK.',
      '..........KWWGK.',
      '.........KWWGEK.',
      '........KWWGEK..',
      '.......KWWGEK...',
      '......KWWGEK....',
      '....KKPPGEK.....',
      '....KPPPPPK.....',
      '.....KPPPPK.....',
      '....KDDKPPK.....',
      '...KDDK.KK......',
      '..KPPK..........',
      '..KKK...........',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 残影闪避 (Defend - Shadow Cloak Afterimage) ---
  a_defend: {
    palette: { K: '#020617', D: '#1E1B4B', P: '#6D28D9', L: '#A855F7', G: '#10B981' },
    grid: [
      '.....KKKKKK.....',
      '...KKPPPPPPKK...',
      '..KPPLLLLLLPPK..',
      '.KPLDDDDDDDDLPK.',
      '.KPDKKGKKGKKDPK.',
      '.KPDKGGKKGGKDPK.',
      '.KPLDDDDDDDDLPK.',
      '..KPPPPPPPPPPK..',
      '.KPPDDDDDDDDPPK.',
      'KPPDDDDDDDDDDPPK',
      '.KKDDKKDDKKDDKK.',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 刀扇之舞 (Blade Dance - Fan of 5 Gleaming Daggers) ---
  a_blade_dance: {
    palette: { K: '#020617', W: '#F8FAFC', C: '#94A3B8', G: '#10B981', Y: '#FACC15' },
    grid: [
      '.KK....KK....KK.',
      'KWWK..KWWK..KWWK',
      'KWCW..KWWK..KWCW',
      '.KWCW.KWWK.KWCW.',
      '..KWCWKWWKKWCW..',
      '...KGGGGGGGGK...',
      '....KYYYYYYK....',
      '.....KKKKKK.....',
      '......KYYK......',
      '......KKKK......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 暗影背刺 (Backstab - Twin Shadow Fangs Striking Vital Mark) ---
  a_backstab: {
    palette: { K: '#020617', P: '#A855F7', R: '#EF4444', G: '#10B981', W: '#FFFFFF' },
    grid: [
      '.PP..........PP.',
      '.PWP........PWP.',
      '..PWP..RR..PWP..',
      '...PWPRWWRPWP...',
      '....PWWGGWWP....',
      '.....PGGGGP.....',
      '....R.GGGG.R....',
      '...R........R...',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 灵巧后空翻 (Backflip - Winged Boots & Somersault Arc) ---
  a_backflip: {
    palette: { K: '#022C22', G: '#10B981', L: '#6EE7B7', C: '#38BDF8', W: '#FFFFFF', Y: '#FACC15' },
    grid: [
      '....CCCCCCCC....',
      '..CCLLLLLLLLCC..',
      '.CLWW......WWLC.',
      'CLW....KK....WLC',
      'CW....KGGK....WC',
      '.....KGGGGK.YY..',
      '....KGGGGGGKYY..',
      '...KGGGGGGGGK...',
      '...KYYYYYYYYK...',
      '...KKKKKKKKKK...',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 致命涂毒 (Deadly Poison - Bubbling Alchemical Venom Flask) ---
  a_deadly_poison: {
    palette: { K: '#052E16', W: '#DCFCE7', L: '#4ADE80', G: '#16A34A', P: '#9333EA', D: '#581C87' },
    grid: [
      '.....KKKKKK.....',
      '.....KLLLLK.....',
      '....KKWWWWKK....',
      '...KGGGGGGGGK...',
      '..KGGLLLLLLGGK..',
      '.KGGLLWWWWLLGGK.',
      '.KGGLWPPPPWLGGK.',
      '.KGGLPPPPPPGLGK.',
      '.KGGGPPDDPPGGGK.',
      '.KGGGGGGGGGGGGK.',
      '..KGGGGGGGGGGK..',
      '...KKKKKKKKKK...',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 淬毒穿刺 (Poison Stab - Serrated Kris Dagger Dripping Acid) ---
  a_poison_stab: {
    palette: { K: '#052E16', G: '#22C55E', L: '#86EFAC', W: '#FFFFFF', P: '#A855F7', Y: '#FACC15' },
    grid: [
      '...........GGG..',
      '..........GLLWG.',
      '.........GLLWG..',
      '........GLLWG.L.',
      '.......GLLWG..G.',
      '......GLLWG.....',
      '....KKPPGK..L...',
      '....KYYYYK..G...',
      '...KPPK.KK......',
      '..KPPK..........',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 斗篷与匕首 (Cloak and Dagger - Swirling Cloak + Hidden Blade) ---
  a_cloak_dagger: {
    palette: { K: '#020617', P: '#7E22CE', L: '#C084FC', W: '#F8FAFC', G: '#10B981', Y: '#FACC15' },
    grid: [
      '....PPPPPPPP....',
      '..PPLLLLLLLLPP..',
      '.PLLKKKKKKKKLLP.',
      'PLKK..WWWW..KKLP',
      'PLK..WWWWG...KLP',
      'PLK.WWWWG....KLP',
      '.PLKWWWG....KLP.',
      '..PLYYG....KLP..',
      '...PYY....PPP...',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 瘟疫毒雾 (Crippling Cloud - Toxic Miasma Skull Cloud) ---
  a_crippling_cloud: {
    palette: { K: '#052E16', G: '#22C55E', L: '#86EFAC', P: '#9333EA', Y: '#FDE047' },
    grid: [
      '....KKKKKKKK....',
      '..KKLLLLLLLLKK..',
      '.KLLGGGGGGGGLLK.',
      '.KLGGKKGGKKGGLK.',
      '.KLGKYYKKYYKGLK.',
      '.KLGGKKGGKKGGLK.',
      '..KLLGGKKGGLLK..',
      '...KKGGGGGGKK...',
      '..P.KGKGGKGK.P..',
      '.PPP.KKKKKK.PPP.',
      '..P...G..G...P..',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 致命毒爆 (Venom Blast - Detonating Green Skull Bomb) ---
  a_venom_blast: {
    palette: { K: '#052E16', G: '#22C55E', L: '#86EFAC', Y: '#FDE047', P: '#A855F7', W: '#FFFFFF' },
    grid: [
      '.L....YYYY....L.',
      '..G..YWWWWY..G..',
      '...GLWGGGGWLG...',
      '..GLGGKKKKGGLG..',
      '.GLGGKYYKKYGGLG.',
      '.GLGGKYYKKYGGLG.',
      '..GLGGKKKKGGLG..',
      '...GLWGGGGWLG...',
      '..G..YWWWWY..G..',
      '.L....YYYY....L.',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 精准投掷 (Accuracy - Bullseye Crosshair & Flying Kunai) ---
  a_accuracy: {
    palette: { K: '#020617', R: '#EF4444', G: '#10B981', W: '#FFFFFF', Y: '#FACC15' },
    grid: [
      '......RRRR......',
      '....RR....RR....',
      '...R...RR...R...',
      '..R..R.WW.R..R..',
      '.R..R..WW..R..R.',
      '.R.RRRRWWRRRR.R.',
      '.R..R..GG..R..R.',
      '..R..R.YY.R..R..',
      '...R...RR...R...',
      '....RR....RR....',
      '......RRRR......',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 无限刃舞 (Infinite Blades - 8-Spoke Spinning Blade Wheel) ---
  a_infinite_blades: {
    palette: { K: '#020617', W: '#F8FAFC', G: '#10B981', L: '#6EE7B7', Y: '#FACC15' },
    grid: [
      '..W....WW....W..',
      '...WL..WW..LW...',
      '....WL.GG.LW....',
      '.....WLGGLE.....',
      'WWWWGGYYYYGGWWWW',
      'WWWWGGYYYYGGWWWW',
      '.....ELGGLW.....',
      '....WL.GG.LW....',
      '...WL..WW..LW...',
      '..W....WW....W..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 绝命终结技 (Finisher - Crimson-Emerald Execution X-Slash) ---
  a_finisher: {
    palette: { K: '#020617', G: '#10B981', L: '#6EE7B7', R: '#EF4444', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      'RW............WR',
      'RWW..........WWR',
      '.RWWG......GWWR.',
      '..RWWG....GWWR..',
      '...RWWG..GWWR...',
      '....RWWYYWWR....',
      '....RWWYYWWR....',
      '...RWWG..GWWR...',
      '..RWWG....GWWR..',
      '.RWWG......GWWR.',
      'RWW..........WWR',
      'RW............WR',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 剧毒催化剂 (Catalyst - Twin Mutating Bio-Helix Vials) ---
  a_catalyst: {
    palette: { K: '#052E16', G: '#22C55E', L: '#86EFAC', Y: '#FDE047', P: '#A855F7', W: '#FFFFFF' },
    grid: [
      '..KKKK....KKKK..',
      '.KLLLLK..KLLLLK.',
      '.KLWWLKYYKLWWLK.',
      '.KLGGLKYYKLGGLK.',
      '.KLGGPPPPPPGGLK.',
      '.KLGGLKYYKLGGLK.',
      '.KGGGGK..KGGGGK.',
      '..KKKK....KKKK..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 残影化形 (After Image - Triple Layered Phantom Clones) ---
  a_after_image: {
    palette: { K: '#090D16', I: '#6366F1', L: '#A5B4FC', C: '#22D3EE', G: '#10B981' },
    grid: [
      '..IIII..LLLL.CCC',
      '.ILLLL..LLLL.CCC',
      '.ILGGL..LLLL.CCC',
      '..IIII..LLLL.CCC',
      'IIIIII.LLLLLL.CC',
      'ILLLLL.LLLLLL.CC',
      'IIIIII.LLLLLL.CC',
      '.II.II..LL.LL.C.',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 肾上腺素 (Adrenaline - Neon Racing Heart & Syringe) ---
  a_adrenaline: {
    palette: { K: '#450A0A', R: '#EF4444', P: '#EC4899', G: '#10B981', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '..RRRR....RRRR..',
      '.RPPPPR..RPPPPR.',
      'RPPWWPPRRPPWWPPR',
      'RPPWWWWGGWWWWPPR',
      'RPPGGGGYYGGGGPPR',
      '.RPPGGGYYGGGPPR.',
      '..RPPGGGGGGPPR..',
      '...RPPPPPPPPR...',
      '....RRRRRRRR....',
      '.....RRRRRR.....',
      '......RRRR......',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 毒雾弥漫 (Noxious Fumes - Cursed Toxic Censer Burner) ---
  a_noxious_fumes: {
    palette: { K: '#052E16', G: '#22C55E', L: '#86EFAC', P: '#9333EA', Y: '#FACC15' },
    grid: [
      '..LL..GGGG..LL..',
      '.GLLG.GPPG.GLLG.',
      '..GG..GGGG..GG..',
      '....GGGGGGGG....',
      '..KKYYYYYYYYKK..',
      '.KYYGGGGGGGGYYK.',
      '.KYGGPPPPPPGGYK.',
      '..KYYYYYYYYYYK..',
      '...KK......KK...',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 涂毒之刃 (Envenom - Viper Fangs Dripping onto Blade) ---
  a_envenom: {
    palette: { K: '#052E16', G: '#10B981', L: '#6EE7B7', W: '#FFFFFF', P: '#A855F7' },
    grid: [
      '..WW........WW..',
      '..WW........WW..',
      '...WL......LW...',
      '...GL......LG...',
      '....G..WW..G....',
      '......GWWG......',
      '.....GWWWWG.....',
      '....GWWGGWWG....',
      '...PPPPPPPPPP...',
      '.....PPPPPP.....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 千刀万剐 (A Thousand Cuts - Web of 1000 Crimson-Emerald Slashes) ---
  a_thousand_cuts: {
    palette: { R: '#EF4444', G: '#10B981', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      'W....R....G....W',
      '.W...R...G....W.',
      '..W..R..G....W..',
      'GGGWRRGGYYYYWGGG',
      '....W.RY...W....',
      '...W..R.Y.W.....',
      'RRRRW.R..WRRRRRR',
      '.W...WR...W.....',
      'W....R.W...W....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 计算下注 (Calculated Gamble - Tumbling Golden Dice & Cards) ---
  a_calculated_gamble: {
    palette: { K: '#090D16', Y: '#FACC15', W: '#FFFFFF', R: '#EF4444', G: '#10B981' },
    grid: [
      '..KKKKKK........',
      '.KWWWWWWK.......',
      '.KWRKWRWK.KKKKKK',
      '.KWWWWWWKKYYYYYY',
      '.KWRKWRWKYGKYGYK',
      '..KKKKKK.KYYYYYY',
      '.........KYGYKYK',
      '.........KYYYYYY',
      '..........KKKKKK',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  // --- Neutral: 圣光治愈 (Apothecary - Radiant Healing Chalice) ---
  n_apothecary: {
    palette: { K: '#064E3B', Y: '#FDE047', G: '#10B981', L: '#6EE7B7', W: '#FFFFFF' },
    grid: [
      '......WWWW......',
      '....WWLLLLWW....',
      '...KKKKKKKKKK...',
      '..KYYYYYYYYYYK..',
      '..KYLLGGGGLLYK..',
      '...KYYYYYYYYK...',
      '....KYYYYYYK....',
      '.....KYYYYK.....',
      '....KKYYYYKK....',
      '...KYYYYYYYYK...',
      '...KKKKKKKKKK...',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Neutral: 战术专注 (Battle Trance - Third-Eye Tactician Crest) ---
  n_battle_trance: {
    palette: { K: '#090D16', C: '#38BDF8', Y: '#FACC15', W: '#FFFFFF', P: '#A855F7' },
    grid: [
      '....CCCCCCCC....',
      '..CCYYYYYYYYCC..',
      '.CYYWWWWWWWWYYC.',
      'CYWWCCCCCCCCWWYC',
      'CYWCCYYYYYYCCWYC',
      'CYWCYYWWWWYYCWYC',
      'CYWCCYYYYYYCCWYC',
      'CYWWCCCCCCCCWWYC',
      '.CYYWWWWWWWWYYC.',
      '..CCYYYYYYYYCC..',
      '....CCCCCCCC....',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Neutral: 震荡冲击波 (Shockwave - Concentric Seismic Rings) ---
  n_shockwave: {
    palette: { P: '#A855F7', O: '#F97316', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '....PPPPPPPP....',
      '..PP........PP..',
      '.P..OOOOOOOO..P.',
      'P..O........O..P',
      'P.O..YYYYYY..O.P',
      'P.O.YWWWWWWY.O.P',
      'P.O.YWWWWWWY.O.P',
      'P.O..YYYYYY..O.P',
      'P..O........O..P',
      '.P..OOOOOOOO..P.',
      '..PP........PP..',
      '....PPPPPPPP....',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Neutral: 远古龙鳞甲 (Ancient Armor - Spiked Dragonscale Cuirass) ---
  n_ancient_armor: {
    palette: { K: '#451A03', Y: '#FACC15', G: '#D97706', R: '#EF4444', W: '#FEF08A' },
    grid: [
      '.Y..KKKKKKKK..Y.',
      'YY.KYYYYYYYYK.YY',
      '.YKGGGGGGGGGGKY.',
      '.KGGYYGGGGYYGGK.',
      'KGGYRRGGGGYYRGGK',
      'KGGGGGGGGGGGGGGK',
      '.KGGYYGGGGYYGGK.',
      '..KGGGGGGGGGGK..',
      '...KYYYYYYYYK...',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 烈焰铁障 (Flame Barrier - Blazing Spiked Tower Shield) ---
  w_flame_barrier: {
    palette: { K: '#1A0A08', R: '#EF4444', O: '#F97316', Y: '#FDE047', S: '#94A3B8', W: '#FFFFFF' },
    grid: [
      '..O..YYYYYY..O..',
      '.ORO.YWWWWY.ORO.',
      'ORROKKKKKKKKORRO',
      'ORRKSSSSSSSSKRRO',
      '.ORKSYYYYYYSKRO.',
      '..KSSYRRRRYSKK..',
      '..KSSYRWWRYSSK..',
      '..KSSYRRRRYSKK..',
      '...KSYYYYYYSK...',
      '....KSSSSSSK....',
      '.....KSSSSK.....',
      '......KKKK......',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 百战坚毅 (True Grit - Cracked Iron Fist & Ash Shield) ---
  w_true_grit: {
    palette: { K: '#0F172A', S: '#64748B', L: '#CBD5E1', Y: '#FACC15', R: '#EF4444', W: '#FFFFFF' },
    grid: [
      '....KKKKKKKK....',
      '...KLLLLLLLLK...',
      '..KLSSSSSSSSK...',
      '..KLSKLSKLSKLK..',
      '..KSSSSSSSSSSK..',
      '..KSSYYYYYYSSK..',
      '..KSSYWWWWYSSK..',
      '...KSYYYYYYSK...',
      '...KSSSSSSSSK...',
      '....KSSSSSSK....',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 灰烬契约 (Burning Pact - Soul-Fire Contract Scroll) ---
  w_burning_pact: {
    palette: { K: '#1E1B4B', P: '#9333EA', O: '#F97316', Y: '#FDE047', W: '#FEF3C7', R: '#EF4444' },
    grid: [
      '..O....YY....O..',
      '.ORO..YWWY..ORO.',
      '..KKKKKKKKKKKK..',
      '.KWWWWWWWWWWWWK.',
      '.KWKRRRRRRRRKWK.',
      '.KWWWWWWWWWWWWK.',
      '.KWKPPPPPPPPKWK.',
      '.KWWWWWWWWWWWWK.',
      '..KKKKPPPPKKKK..',
      '...P..OYYO..P...',
      '..PRP.YYYY.PRP..',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Warrior: 沸血狂斩 (Blood Strike - Jagged Crimson Greatsword) ---
  w_blood_strike: {
    palette: { K: '#450A0A', R: '#DC2626', L: '#FCA5A5', Y: '#FACC15', W: '#FFFFFF' },
    grid: [
      '...........RRR..',
      '..........RLLWR.',
      '.........RLLWR..',
      '........RLLWR.R.',
      '.......RLLWR..L.',
      '......RLLWR.....',
      '....KKYYRK..R...',
      '....KYYYYK......',
      '...KRRK.KK......',
      '..KRRK..........',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 熔核爆破 (Melter - Shield-Shattering Magma Lance) ---
  m_melter: {
    palette: { K: '#450A0A', R: '#EF4444', O: '#F97316', Y: '#FDE047', C: '#38BDF8', W: '#FFFFFF' },
    grid: [
      '......YYYY......',
      '.....YWWWWY.....',
      '...CC.YWWY.CC...',
      '..C..ROWWOR..C..',
      '.C..ROOYYOOR..C.',
      '....ROYYYYOR....',
      '..CC.ROOOOR.CC..',
      '.C....RRRR....C.',
      '.......RR.......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 星轨扩容矩阵 (Capacitor - 6-Slot Hexagonal Astral Ring) ---
  m_capacitor: {
    palette: { K: '#082F49', C: '#22D3EE', B: '#0284C7', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '......YYYY......',
      '.....YWWWWY.....',
      '.CC...YYYY...CC.',
      'CWWC..BBBB..CWWC',
      '.CC.BBCCCCBB.CC.',
      '...BCWWWWWWCB...',
      '.CCBCWYYYYWCBCC.',
      'CWWBCWYYYYWCBCWW',
      '.CC.BCWWWWCB.CC.',
      '.....BBBBBB.....',
      '......YYYY......',
      '.....YWWWWY.....',
      '......YYYY......',
      '................',
      '................',
      '................',
    ],
  },
  // --- Mage: 零式跃迁 (Scrape - High-Speed Cyber-Arcane Warp Slash) ---
  m_scrape: {
    palette: { C: '#22D3EE', B: '#0284C7', Y: '#FDE047', P: '#A855F7', W: '#FFFFFF' },
    grid: [
      '.WWWWWWWWWWWW...',
      '..CCCCCCCCCCCW..',
      '....BBBBBBBBBCW.',
      '..WWWWWWWWWWWW..',
      '...YYYYYYYYYYW..',
      '.....PPPPPPPPCW.',
      '..WWWWWWWWWWWW..',
      '...CCCCCCCCCCW..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 脱身残影 (Escape Plan - Vanishing Smoke Bomb & Shadow Silhouette) ---
  a_escape_plan: {
    palette: { K: '#090D16', S: '#64748B', L: '#CBD5E1', G: '#10B981', C: '#22D3EE', W: '#FFFFFF' },
    grid: [
      '....SSSSSSSS....',
      '..SSLLLLLLLLSS..',
      '.SLLKKKKKKKKLLS.',
      'SLKK..CCCC..KKLS',
      'SLK..CWWWWC..KLS',
      'SLK..GGGGGG..KLS',
      '.SLK..KKKK..KLS.',
      '..SSLLLLLLLLSS..',
      '....SSSSSSSS....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 掠影投刃 (Dagger Throw - Spinning Twin Kunai & Card Trail) ---
  a_dagger_throw: {
    palette: { K: '#020617', G: '#10B981', L: '#6EE7B7', Y: '#FACC15', W: '#FFFFFF' },
    grid: [
      '..........WWWW..',
      '........WWLLLLW.',
      '......WWLLGGGG..',
      '....YYYYGGGG....',
      '...YWWWWY.......',
      '....YYYY..WWWW..',
      '........WWLLLLW.',
      '......WWLLGGGG..',
      '....YYYYGGGG....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 剔骨连斩 (Eviscerate - Triple Crimson-Emerald Claw Rip) ---
  a_eviscerate: {
    palette: { R: '#EF4444', G: '#10B981', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      'RW...RW...RW....',
      '.RWG..RWG..RWG..',
      '..RWGY.RWGY.RWGY',
      '...RWG..RWG..RWG',
      '....RW...RW...RW',
      '.....R....R....R',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 瘟疫尸爆 (Corpse Explosion - Toxic Emerald Supernova Skull) ---
  a_corpse_explosion: {
    palette: { K: '#052E16', G: '#22C55E', L: '#86EFAC', Y: '#FDE047', P: '#9333EA', W: '#FFFFFF' },
    grid: [
      'Y..L..GGGG..L..Y',
      '.Y..GLWWWWLG..Y.',
      '..GLWWKKKKWWLG..',
      '.GLWKKYYYYKKWLG.',
      'GLWKYYKKKKYYKWLG',
      'GLWKKKKKKKKKKWLG',
      '.GLWKKGGGGKKWLG.',
      '..GLWWGGGGWWLG..',
      '.Y..GLLLLLLG..Y.',
      'Y..L..PPPP..L..Y',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // --- Assassin: 千刃风暴 (Storm of Steel - Cyclone of 12 Flying Daggers) ---
  a_storm_of_steel: {
    palette: { W: '#FFFFFF', L: '#A7F3D0', G: '#10B981', Y: '#FDE047', C: '#38BDF8' },
    grid: [
      '..WWWW....WWWW..',
      '.WLLLLW..WLLLLW.',
      'WLLGGLLWWLLGGLLW',
      'WLGGGGYYYYGGGGW.',
      '.WGGGGYWWYGGGGW.',
      '.WGGGGYWWYGGGGW.',
      '.WLGGGGYYYYGGWL.',
      'WLLGGLLWWLLGGLLW',
      '.WLLLLW..WLLLLW.',
      '..WWWW....WWWW..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
};

export const CardPixelArt: React.FC<{ spriteType: string; className?: string }> = ({
  spriteType,
  className = 'w-12 h-12',
}) => {
  const sprite =
    CARD_SPRITES[spriteType] ||
    RELIC_SPRITES[spriteType] ||
    CARD_SPRITES.sword;
  return <PixelGrid grid={sprite.grid} palette={sprite.palette} className={className} />;
};

// ============================================================================
// Dedicated 16x16 Multi-Shaded Relic Pixel Art Icons
// ============================================================================
const RELIC_SPRITES: Record<string, { grid: string[]; palette: Record<string, string> }> = {
  relic_burning_blood: {
    palette: { K: '#450A0A', R: '#EF4444', O: '#F97316', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '.......KK.......',
      '......KRRK......',
      '.....KROORK.....',
      '....KROYYORK....',
      '...KROYYWYORK...',
      '..KRRYYYYYYRRK..',
      '.KRRRROOOORRRRK.',
      '.KRRRRRRRRRRRRK.',
      '..KRRRRRRRRRRK..',
      '...KKKKKKKKKK...',
      '................',
      '................',
    ],
  },
  relic_cracked_core: {
    palette: { K: '#082F49', C: '#22D3EE', B: '#0284C7', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '....KKKKKKKK....',
      '..KKCCCCCCCCKK..',
      '.KCCBBWWWWBBCCK.',
      'KCCBWYYYYYYWBCCK',
      'KCBWYKCCCCKYWBCK',
      'KCBWYCCCCCCCWBCK',
      'KCCBWYYYYYYWBCCK',
      '.KCCBBWWWWBBCCK.',
      '..KKCCCCCCCCKK..',
      '....KKKKKKKK....',
      '................',
      '................',
    ],
  },
  relic_ring_snake: {
    palette: { K: '#052E16', G: '#10B981', L: '#6EE7B7', Y: '#FACC15', R: '#EF4444' },
    grid: [
      '....KKKKKKKK....',
      '..KKGGGGGGGGKK..',
      '.KGGLLLLLLLLGGK.',
      'KGGLKKKKKKKKLGGK',
      'KGLK..KRRK..KLGK',
      'KGLK..KYYK..KLGK',
      'KGGLKKKKKKKKLGGK',
      '.KGGLLLLLLLLGGK.',
      '..KKGGGGGGGGKK..',
      '....KKKKKKKK....',
      '................',
      '................',
    ],
  },
  relic_vajra: {
    palette: { K: '#451A03', Y: '#FDE047', G: '#D97706', W: '#FEF9C3', C: '#38BDF8' },
    grid: [
      '.....KK..KK.....',
      '....KYYKKYYK....',
      '...KYYWWWWYYK...',
      '....KGGGGGGK....',
      '.....KCCCCK.....',
      '....KYYYYYYK....',
      '.....KCCCCK.....',
      '....KGGGGGGK....',
      '...KYYWWWWYYK...',
      '....KYYKKYYK....',
      '.....KK..KK.....',
      '................',
    ],
  },
  relic_smooth_stone: {
    palette: { K: '#0F172A', L: '#94A3B8', W: '#F8FAFC', C: '#38BDF8', D: '#475569' },
    grid: [
      '....KKKKKKKK....',
      '..KKLLLLLLLLKK..',
      '.KLLWWWWWWWWLLK.',
      'KLLWWCCCCCCWWLLK',
      'KLWWCCCCCCCCWWLK',
      'KLLDDDDDDDDDDLLK',
      '.KLLDDDDDDDDLLK.',
      '..KKDDDDDDDDKK..',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
    ],
  },
  relic_anchor: {
    palette: { K: '#082F49', C: '#38BDF8', B: '#0284C7', Y: '#FACC15', W: '#F0F9FF' },
    grid: [
      '......KKKK......',
      '.....KYYYYK.....',
      '......KKKK......',
      '....KKCCCCKK....',
      '......KCCK......',
      '.KK...KCCK...KK.',
      'KCCK..KCCK..KCCK',
      '.KCCKKCCCCKKCCK.',
      '..KCCCCCCCCCCK..',
      '....KKBBBBKK....',
      '......KKKK......',
      '................',
    ],
  },
  relic_lantern: {
    palette: { K: '#090D16', G: '#D97706', C: '#22D3EE', W: '#ECFEFF', Y: '#FDE047' },
    grid: [
      '......KKKK......',
      '....KKGGGGKK....',
      '...KCCCCCCCCK...',
      '...KCWWWWWWCK...',
      '...KCWYYYYWCK...',
      '...KCWYYYYWCK...',
      '...KCWWWWWWCK...',
      '...KCCCCCCCCK...',
      '....KKGGGGKK....',
      '......KKKK......',
      '................',
      '................',
    ],
  },
  relic_scales: {
    palette: { K: '#451A03', Y: '#FACC15', G: '#B45309', O: '#F97316', W: '#FEF08A' },
    grid: [
      '..KK..KKKK..KK..',
      '.KYYKKYYYYKKYYK.',
      'KYYWWYYYYYYWWYYK',
      '.KGGGGGGGGGGGGK.',
      '..KOOYYYYYYOOK..',
      '.KYYGGYYYYGGYYK.',
      'KYYGGGGGGGGGGYYK',
      '.KKKKKGGGGKKKKK.',
      '......KKKK......',
      '................',
      '................',
      '................',
    ],
  },
  relic_orichalcum: {
    palette: { K: '#064E3B', E: '#10B981', L: '#6EE7B7', Y: '#FDE047', W: '#ECFDF5' },
    grid: [
      '....KKKKKKKK....',
      '..KKYYYYYYYYKK..',
      '.KYYEEEEEEEEYYK.',
      'KYYELLWWWWLLEYYK',
      'KYELWWYYYYWWLEYK',
      'KYYELLWWWWLLEYYK',
      '.KYYEEEEEEEEYYK.',
      '..KKYYYYYYYYKK..',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
    ],
  },
  relic_marbles: {
    palette: { K: '#1E1B4B', R: '#EF4444', C: '#38BDF8', Y: '#FACC15', G: '#10B981' },
    grid: [
      '....KKKKKKKK....',
      '...KYYYYYYYYK...',
      '..KRRRRRRRRRRK..',
      '.KRRCCRRRRGGRRK.',
      '.KRCCCCRRGGGGRK.',
      '.KRRRRYYYYRRRRK.',
      '..KRRRYYYYRRRK..',
      '...KKKKKKKKKK...',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  relic_boss_crown: {
    palette: { K: '#450A0A', Y: '#FDE047', G: '#D97706', R: '#EF4444', C: '#38BDF8', W: '#FFFFFF' },
    grid: [
      '.KK....KK....KK.',
      'KYYK..KYYK..KYYK',
      'KYYYK.KWWK.KYYYK',
      'KYYYYKKYYKKYYYYK',
      'KYYRRYYCCYYRRYYK',
      'KYYRRYYCCYYRRYYK',
      'KGGGGGGGGGGGGGGK',
      '.KYYYYYYYYYYYYK.',
      '..KKKKKKKKKKKK..',
      '................',
      '................',
      '................',
    ],
  },
  relic_philosopher: {
    palette: { K: '#450A0A', R: '#EF4444', P: '#EC4899', Y: '#FDE047', W: '#FFFFFF' },
    grid: [
      '......KKKK......',
      '....KKRRRRKK....',
      '...KRRPPPPRRK...',
      '..KRRPWWWWPRRK..',
      '.KRRPWYYYYWPRRK.',
      '.KRRPWYYYYWPRRK.',
      '..KRRPWWWWPRRK..',
      '...KRRPPPPRRK...',
      '....KKRRRRKK....',
      '......KKKK......',
      '................',
      '................',
    ],
  },
  relic_ice_cream: {
    palette: { K: '#451A03', P: '#F472B6', W: '#FFF1F2', C: '#38BDF8', Y: '#FBBF24' },
    grid: [
      '......KKKK......',
      '....KKWWWWKK....',
      '...KPPPPPPPPK...',
      '..KCCCCCCCCCCK..',
      '...KYYYYYYYYK...',
      '....KYYYYYYK....',
      '.....KYYYYK.....',
      '......KYYK......',
      '.......KK.......',
      '................',
      '................',
      '................',
    ],
  },
};

export const RelicPixelArt: React.FC<{ iconType: string; className?: string }> = ({
  iconType,
  className = 'w-6 h-6',
}) => {
  const sprite =
    RELIC_SPRITES[iconType] ||
    CARD_SPRITES[iconType] ||
    RELIC_SPRITES.relic_boss_crown;
  return <PixelGrid grid={sprite.grid} palette={sprite.palette} className={className} />;
};

// ============================================================================
// Visual Pixel Potion Bottle Sprite (for HUD & Shop)
// ============================================================================
export const PotionBottleSprite: React.FC<{
  effectType: string;
  className?: string;
}> = ({ effectType, className = 'w-7 h-7' }) => {
  const liquidColor =
    effectType === 'heal'
      ? { M: '#EF4444', L: '#FCA5A5', D: '#991B1B' }
      : effectType === 'energy'
      ? { M: '#FACC15', L: '#FEF08A', D: '#B45309' }
      : effectType === 'block'
      ? { M: '#38BDF8', L: '#BAE6FD', D: '#0369A1' }
      : effectType === 'poison_all'
      ? { M: '#10B981', L: '#6EE7B7', D: '#065F46' }
      : { M: '#A855F7', L: '#E9D5FF', D: '#581C87' };

  const palette = {
    K: '#020617',
    C: '#D97706',
    G: '#E2E8F0',
    ...liquidColor,
  };

  const grid = [
    '....KKKK....',
    '....KCCK....',
    '...KKKKKK...',
    '....KGGK....',
    '...KG..GK...',
    '..KGLLLLGK..',
    '.KGLMMMMMGK.',
    '.KGMMMMMMGK.',
    '.KGMDDDDMGK.',
    '..KGDDDDGK..',
    '...KKKKKK...',
    '............',
  ];

  return <PixelGrid grid={grid} palette={palette} className={className} />;
};

// ============================================================================
// Visual Floating Orb Sprite (Orbits around Mage in Combat)
// ============================================================================
export const OrbVisualSprite: React.FC<{
  type: 'fire' | 'frost' | 'lightning' | 'dark';
  passiveVal: number;
  evokeVal: number;
}> = ({ type, passiveVal, evokeVal }) => {
  const styleMap = {
    fire: {
      border: 'border-orange-400 shadow-[0_0_16px_rgba(249,115,22,0.85)]',
      bg: 'from-red-600 via-orange-500 to-yellow-300',
      sprite: 'fireball',
    },
    frost: {
      border: 'border-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.85)]',
      bg: 'from-sky-600 via-cyan-400 to-white',
      sprite: 'frost',
    },
    lightning: {
      border: 'border-yellow-300 shadow-[0_0_16px_rgba(250,204,21,0.9)]',
      bg: 'from-amber-600 via-yellow-400 to-amber-100',
      sprite: 'lightning',
    },
    dark: {
      border: 'border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.9)]',
      bg: 'from-purple-950 via-purple-600 to-cyan-300',
      sprite: 'black_hole',
    },
  }[type];

  return (
    <div
      className={`relative w-12 h-12 rounded-full border-2 ${styleMap.border} bg-gradient-to-tr ${styleMap.bg} flex items-center justify-center animate-float-slow select-none`}
    >
      <div className="w-9 h-9 rounded-full bg-slate-950/85 flex items-center justify-center">
        <CardPixelArt spriteType={styleMap.sprite} className="w-6 h-6" />
      </div>
      {/* Passive Badge (bottom-right) */}
      <span className="absolute -bottom-1.5 -right-1 px-1 bg-slate-950 border border-cyan-300 text-[10px] font-mono font-black text-cyan-200 leading-none">
        {passiveVal}
      </span>
      {/* Evoke Badge (top-left) */}
      <span className="absolute -top-1.5 -left-1 px-1 bg-slate-950 border border-amber-300 text-[10px] font-mono font-black text-amber-300 leading-none">
        ⚡{evokeVal}
      </span>
    </div>
  );
};

// ============================================================================
// Physical 3D Pixel Card Stack Widget (Draw Pile & Discard Pile)
// ============================================================================
export const CardStackWidget: React.FC<{
  count: number;
  label: string;
  color: 'amber' | 'slate';
  onClick: () => void;
}> = ({ count, label, color, onClick }) => {
  const borderClass =
    color === 'amber'
      ? 'border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.35)]'
      : 'border-slate-500 shadow-[0_0_14px_rgba(148,163,184,0.25)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-20 h-26 flex flex-col items-center justify-center cursor-pointer transition-transform hover:-translate-y-2 select-none"
    >
      {/* Stacked Card Layers */}
      <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-slate-900 border-2 border-slate-700" />
      <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 bg-slate-900 border-2 border-slate-600" />
      <div
        className={`relative w-full h-full bg-slate-950 border-2 ${borderClass} overflow-hidden flex flex-col items-center justify-between p-1.5`}
      >
        <img
          src="/src/assets/images/pixel_card_back_1791767688276.jpg"
          alt={label}
          className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-80 transition-opacity"
          style={{ imageRendering: 'pixelated' }}
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10 w-8 h-8 rounded-full bg-slate-950/95 border-2 border-amber-300 flex items-center justify-center text-sm font-black font-mono text-amber-300 shadow-[2px_2px_0_#000] mt-2">
          {count}
        </div>
        <span className="relative z-10 w-full text-center bg-slate-950/95 border border-slate-700 text-[10px] font-black text-slate-200 py-0.5">
          {label}
        </span>
      </div>
    </button>
  );
};

// High-Detail Character Portraits with Animated Class Aura
export const CharacterSprite: React.FC<{
  classType: 'warrior' | 'mage' | 'assassin';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}> = ({ classType, size = 'md', animated = true }) => {
  const sizeClass =
    size === 'sm'
      ? 'w-14 h-14'
      : size === 'xl'
      ? 'w-44 h-44'
      : size === 'lg'
      ? 'w-32 h-32'
      : 'w-24 h-24';

  const borderGlow =
    classType === 'warrior'
      ? 'border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.5)]'
      : classType === 'mage'
      ? 'border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.5)]'
      : 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.5)]';

  const imgSrc =
    classType === 'warrior'
      ? '/src/assets/images/warrior_avatar_1791767701481.jpg'
      : classType === 'mage'
      ? '/src/assets/images/mage_avatar_1791767724266.jpg'
      : '/src/assets/images/assassin_avatar_hd_1791769529332.jpg';

  const classLabel =
    classType === 'warrior'
      ? '铁卫剑圣'
      : classType === 'mage'
      ? '星界秘法师'
      : '暗影刺客';

  return (
    <div
      className={`relative ${sizeClass} border-2 ${borderGlow} bg-slate-950 overflow-hidden select-none ${
        animated ? 'animate-float-slow' : ''
      }`}
    >
      <img
        src={imgSrc}
        alt={classLabel}
        className={`w-full h-full object-cover ${
          classType === 'assassin' ? 'object-top scale-115 origin-top' : 'object-center'
        }`}
        style={{ imageRendering: 'pixelated' }}
        referrerPolicy="no-referrer"
      />
      <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-amber-300" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-300" />
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent py-0.5 text-center">
        <span className="text-[10px] font-bold text-amber-300 tracking-wider">
          {classLabel}
        </span>
      </div>
    </div>
  );
};

// Detailed 16x16 Multi-Shaded Enemy Sprites Across 3 Acts
const ENEMY_GRIDS: Record<string, { grid: string[]; palette: Record<string, string> }> = {
  skeleton: {
    palette: {
      K: '#020617',
      W: '#F8FAFC',
      L: '#CBD5E1',
      G: '#64748B',
      R: '#EF4444',
      Y: '#FACC15',
      B: '#B45309',
    },
    grid: [
      '....KKKKKKKK....',
      '...KWWWWWWWWK...',
      '..KWWLLLLLLWWK..',
      '..KWLKRRKKRRWK..',
      '..KWWLLLLLLWWK..',
      '...KWKWKWKWKW...',
      '....KKKKKKKK....',
      '.KKYYWWWWWWYYKK.',
      'KYYBWWWWWWWWBYYK',
      'KYB.KWWWWWWK.BYK',
      '....KGGGGGGK....',
      '...KWWK..KWWK...',
      '...KWWK..KWWK...',
      '..KGGGK..KGGGK..',
      '..KKKK....KKKK..',
      '................',
    ],
  },
  cultist: {
    palette: {
      K: '#090D16',
      P: '#7E22CE',
      L: '#A855F7',
      D: '#3B0764',
      Y: '#FDE047',
      R: '#EF4444',
    },
    grid: [
      '.....KKKKKK.....',
      '....KPPPPPPK....',
      '...KPPLLLLPPK...',
      '..KPPYYYYYYPPK..',
      '..KPYKRRRRKYPK..',
      '...KPPPPPPPPK...',
      '.KKDDDDPPPPDDDD.',
      'KDPPPPPPPPPPPPPK',
      'KDPPPLYYYYLPPPDK',
      '.KDP.KPPPPK.PDK.',
      '....KPPPPPPK....',
      '...KPPPPPPPPK...',
      '..KDDDDKKDDDDK..',
      '..KKKKK..KKKKK..',
      '................',
      '................',
    ],
  },
  spider: {
    palette: {
      K: '#090D16',
      D: '#18181B',
      P: '#9333EA',
      G: '#22C55E',
      R: '#EF4444',
    },
    grid: [
      '................',
      '.P...KKKKKK...P.',
      '..P.KDDDDDDK.P..',
      '...PKDRRKKRDKP..',
      '.PP.KDGGKKGDK.PP',
      'P...KDDDDDDDK..P',
      '....KPPPPPPPK...',
      '..PP.KDDDDDK.PP.',
      '.P..P.KKKKK.P..P',
      'P..P.........P.P',
      '................',
    ],
  },
  void_wraith: {
    palette: {
      K: '#020617',
      D: '#1E1B4B',
      P: '#8B5CF6',
      C: '#38BDF8',
      W: '#F8FAFC',
    },
    grid: [
      '....KKKKKKKK....',
      '..KKDDDDDDDDKK..',
      '.KDDPPPPPPPPDDK.',
      'KDDPCCCCCCCCPDDK',
      'KDPCCWWKKWWCCPDK',
      'KDPCCWWKKWWCCPDK',
      'KDDPPPPPPPPPPDDK',
      '.KDDPPPPPPPPDDK.',
      '..KDDP.PP.PDDK..',
      '...KDP.PP.PDK...',
      '....K..KK..K....',
      '................',
    ],
  },
  clockwork_golem: {
    palette: {
      K: '#090D16',
      Y: '#FACC15',
      G: '#B45309',
      S: '#94A3B8',
      C: '#22D3EE',
      R: '#EF4444',
    },
    grid: [
      '...KKKKKKKKKK...',
      '..KYYYYYYYYYYK..',
      '..KYSSSSSSSSYK..',
      '..KYSKCCCCKSYK..',
      '..KYSSSSSSSSYK..',
      '.KKGGGGGGGGGGKK.',
      'KYYGSSSSSSSSGYYK',
      'KYYGSKRRRRKSGYYK',
      'KYYGSSSSSSSSGYYK',
      '.KKGGGGGGGGGGKK.',
      '...KSSK..KSSK...',
      '...KYYK..KYYK...',
      '...KKKK..KKKK...',
    ],
  },
  elite_demon: {
    palette: {
      K: '#090D16',
      Y: '#FDE047',
      O: '#F97316',
      R: '#DC2626',
      D: '#7F1D1D',
    },
    grid: [
      '.Y....KKKK....Y.',
      'YY...KRRRRK...YY',
      '.YY.KRRRRRRK.YY.',
      '..KKRRYYYYRRKK..',
      '..KRRYOOOOYRRK..',
      '.KDDDDRRRRDDDDK.',
      'KDRRRRRRRRRRRRDK',
      'KDRRKYYYYYYKRRDK',
      '.KDR.KRRRRK.RDK.',
      '....KRRRRRRK....',
      '...KRRRRKRRRR...',
      '..KDDDDK.KDDDD..',
    ],
  },
  boss_lich: {
    palette: {
      K: '#020617',
      Y: '#FDE047',
      C: '#22D3EE',
      P: '#9333EA',
      W: '#F8FAFC',
      G: '#10B981',
    },
    grid: [
      '.Y...Y.KK.Y...Y.',
      '.YY.YYKYYKYY.YY.',
      '..YYYYYYYYYYYY..',
      '..KWWWWWWWWWWK..',
      '..KWKGGKKGGKWK..',
      '..KWWWWWWWWWWK..',
      '...KWKWKWKWKW...',
      '.KKPPPPPPPPPPKK.',
      'KPPCCCCCCCCCCPPK',
      'KPPCPPPPPPPPCPPK',
      '.KPPPPGGGGPPPPK.',
      '..KPPPPPPPPPPK..',
      '...KPPK..KPPK...',
      '...KKKK..KKKK...',
    ],
  },
  boss_archon: {
    palette: {
      K: '#020617',
      C: '#38BDF8',
      W: '#FFFFFF',
      P: '#A855F7',
      Y: '#FDE047',
    },
    grid: [
      '......YYYY......',
      '...YY.KKKK.YY...',
      '..Y..KCCCCK..Y..',
      '.Y..KCWWWWCK..Y.',
      'Y..KCCCCCCCCK..Y',
      '..KPPPPPPPPPPK..',
      '.KPPCCCCCCCCPPK.',
      'KPPCWYYYYYYWCPPK',
      'KPPCWYYYYYYWCPPK',
      '.KPPCCCCCCCCPPK.',
      '..KPPPPPPPPPPK..',
      '...KCCCCCCCCK...',
      '....KCC..CCK....',
      '.....KK..KK.....',
    ],
  },
};

const ENEMY_BERSERK_PALETTES: Record<string, Record<string, string>> = {
  boss_lich: {
    K: '#1F0404',
    Y: '#FDE047',
    C: '#EF4444',
    P: '#991B1B',
    W: '#FECACA',
    G: '#F97316',
  },
  boss_archon: {
    K: '#1F0404',
    C: '#EF4444',
    W: '#FEF08A',
    P: '#7F1D1D',
    Y: '#F97316',
  },
};

export const EnemySprite: React.FC<{
  spriteType: string;
  tier: 'normal' | 'elite' | 'boss';
  isHit?: boolean;
  isBerserk?: boolean;
}> = ({ spriteType, tier, isHit = false, isBerserk = false }) => {
  const borderColor = isBerserk
    ? 'border-red-500 shadow-[0_0_36px_rgba(239,68,68,0.95),inset_0_0_22px_rgba(220,38,38,0.65)]'
    : tier === 'boss'
    ? 'border-amber-400 shadow-[0_0_26px_rgba(251,191,36,0.6)]'
    : tier === 'elite'
    ? 'border-purple-400 shadow-[0_0_18px_rgba(192,132,252,0.5)]'
    : 'border-slate-500 shadow-[4px_4px_0px_#000]';

  const sizeClass =
    tier === 'boss' ? 'w-36 h-36' : tier === 'elite' ? 'w-28 h-28' : 'w-24 h-24';

  const berserkAnimClass = isBerserk ? 'animate-boss-berserk-sprite' : 'animate-float-slow';

  if (spriteType === 'slime') {
    return (
      <div
        className={`relative ${sizeClass} border-2 ${borderColor} bg-slate-900 overflow-hidden ${berserkAnimClass} ${
          isHit ? 'animate-shake-hit brightness-150' : ''
        }`}
      >
        <img
          src="/src/assets/images/slime_enemy_1791767734619.jpg"
          alt="腐化史莱姆"
          className="w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (spriteType === 'boss_dragon') {
    return (
      <div
        className={`relative ${sizeClass} border-2 ${borderColor} bg-slate-950 overflow-visible ${berserkAnimClass} ${
          isHit ? 'animate-shake-hit brightness-150' : ''
        }`}
      >
        {isBerserk && (
          <>
            <div className="absolute -inset-2.5 border-2 border-red-500/80 animate-ping pointer-events-none" />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 bg-red-950 border-2 border-yellow-300 text-[10px] font-black text-yellow-200 whitespace-nowrap shadow-[0_0_16px_rgba(239,68,68,1)]">
              🔥 狂暴二阶段 · BERSERK
            </div>
          </>
        )}
        <div className="w-full h-full overflow-hidden relative">
          <img
            src="/src/assets/images/boss_dragon_hd_1791769545234.jpg"
            alt="绯红魔龙皇"
            className={`w-full h-full object-cover object-top scale-125 origin-top transition-all duration-500 ${
              isBerserk
                ? 'sepia-[0.4] saturate-[2.4] -hue-rotate-15 contrast-125'
                : ''
            }`}
            style={{ imageRendering: 'pixelated' }}
            referrerPolicy="no-referrer"
          />
          {isBerserk && (
            <div className="absolute inset-0 bg-gradient-to-t from-red-600/45 via-orange-500/15 to-transparent mix-blend-screen pointer-events-none" />
          )}
        </div>
      </div>
    );
  }

  const sprite = ENEMY_GRIDS[spriteType] || ENEMY_GRIDS.skeleton;
  const activePalette =
    isBerserk && ENEMY_BERSERK_PALETTES[spriteType]
      ? ENEMY_BERSERK_PALETTES[spriteType]
      : sprite.palette;

  return (
    <div
      className={`relative ${sizeClass} border-2 ${borderColor} ${
        isBerserk ? 'bg-red-950/90' : 'bg-slate-950/95'
      } flex items-center justify-center p-2 ${berserkAnimClass} ${
        isHit ? 'animate-shake-hit brightness-150' : ''
      }`}
    >
      {isBerserk && (
        <>
          <div className="absolute -inset-2.5 border-2 border-red-500/80 animate-ping pointer-events-none" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 bg-red-950 border-2 border-yellow-300 text-[10px] font-black text-yellow-200 whitespace-nowrap shadow-[0_0_16px_rgba(239,68,68,1)]">
            🔥 狂暴二阶段 · BERSERK
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-red-600/35 via-transparent to-red-500/20 pointer-events-none" />
        </>
      )}
      <PixelGrid grid={sprite.grid} palette={activePalette} className="w-full h-full relative z-10" />
    </div>
  );
};

// Combat Visual Effect Burst Overlay
export const VfxBurst: React.FC<{
  type: 'slash' | 'fire' | 'frost' | 'lightning' | 'poison' | 'shield' | null;
}> = ({ type }) => {
  if (!type) return null;

  const colorMap: Record<string, string> = {
    slash: 'border-red-400 bg-red-500/35 text-red-100',
    fire: 'border-orange-400 bg-orange-500/40 text-yellow-100',
    frost: 'border-cyan-300 bg-cyan-500/40 text-cyan-50',
    lightning: 'border-yellow-300 bg-amber-400/45 text-yellow-50',
    poison: 'border-emerald-400 bg-emerald-500/40 text-emerald-50',
    shield: 'border-sky-300 bg-sky-500/40 text-sky-50',
  };

  const labelMap: Record<string, string> = {
    slash: '⚔️ 斩!',
    fire: '🔥 爆!',
    frost: '❄️ 冻!',
    lightning: '⚡ 雷!',
    poison: '☠️ 毒!',
    shield: '🛡️ 盾!',
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-slash-arc">
      <div
        className={`px-3 py-1.5 border-2 font-black text-sm shadow-[0_0_24px_rgba(255,255,255,0.85)] ${
          colorMap[type] || colorMap.slash
        }`}
      >
        {labelMap[type]}
      </div>
    </div>
  );
};

// Pixel Art Map Node Icons (16x16 high-contrast charcoal-ink Slay-the-Spire style icons)
const MAP_NODE_SPRITES: Record<string, { grid: string[]; palette: Record<string, string> }> = {
  // 普通敌人：交叉钢剑与暗黑盾纹 (Crossed Iron Swords - crisp dark ink outline)
  combat: {
    palette: {
      K: '#1c120c',
      S: '#64748b',
      L: '#cbd5e1',
      W: '#f8fafc',
      G: '#d97706',
      Y: '#fbbf24',
      B: '#5c2d0c',
    },
    grid: [
      '.KK..........KK.',
      'KWWK........KWWK',
      'KWSWK......KWSWK',
      '.KWSWK....KWSWK.',
      '..KWSWK..KWSWK..',
      '...KWSWKKWSWK...',
      '....KWWWWWWK....',
      '...KKKWWWWKKK...',
      '..KYYGKKKKGYYK..',
      '.KGGK.KWWK.KGGK.',
      '.KBK.K.KK.K.KBK.',
      'KBK..K....K..KBK',
      'KK............KK',
      '................',
      '................',
      '................',
    ],
  },
  // 精英敌人：双角猩红恶魔骷髅 (Horned Elite Devil Skull)
  elite: {
    palette: {
      K: '#1c120c',
      Y: '#f59e0b',
      W: '#fef3c7',
      R: '#dc2626',
      D: '#7f1d1d',
      E: '#fef08a',
    },
    grid: [
      'KK............KK',
      'KWK..........KWK',
      'KYWK..KKKK..KWYK',
      '.KYYKKRRRRKKYYK.',
      '..KYYRRRRRRYYK..',
      '...KRRRRRRRRK...',
      '..KRRKKRRKKRRK..',
      '..KRREKRREKRRK..',
      '..KRRRRRRRRRRK..',
      '...KRRDDDDDRK...',
      '....KRKRRKRK....',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // 休息处：熊熊篝火与交叉柴木 (Campfire Flames & Crossed Logs)
  rest: {
    palette: {
      K: '#1c120c',
      R: '#dc2626',
      O: '#f97316',
      Y: '#fde047',
      W: '#ffffff',
      B: '#78350f',
      D: '#451a03',
    },
    grid: [
      '.......KK.......',
      '......KRRK......',
      '.....KROORK.....',
      '....KROYYORK....',
      '...KROYYYYORK...',
      '...KROYWWYORK...',
      '...KROYYYYORK...',
      '....KOYYYYOK....',
      '..KKKOOOOOOKKK..',
      '.KBBBBKKKKBBBBK.',
      'KBDDBBKKKKBBDDBK',
      '.KKKKBDDDDBKKKK.',
      '.....KKKKKK.....',
      '................',
      '................',
      '................',
    ],
  },
  // 财宝：仅在第8/9层出现的拱顶束带宝箱 (Mid-Act Arched Treasure Chest)
  treasure: {
    palette: {
      K: '#1c120c',
      Y: '#eab308',
      W: '#fef08a',
      B: '#92400e',
      D: '#451a03',
      S: '#94a3b8',
    },
    grid: [
      '................',
      '..KKKKKKKKKKKK..',
      '.KYYYYYYYYYYYYK.',
      'KYBBBBYYYYBBBBYK',
      'KYBBBBYYYYBBBBYK',
      'KKKKKKKKKKKKKKKK',
      'KYYYYYKKKKYYYYYK',
      'KYBBBKWWWWKBBBYK',
      'KYBBBKWSSWKBBBYK',
      'KYDDDDKKKKDDDDYK',
      'KYDDDDYYYYDDDDYK',
      '.KYYYYYYYYYYYYK.',
      '..KKKKKKKKKKKK..',
      '................',
      '................',
      '................',
    ],
  },
  // 商店：系绳钱袋与金币徽记 (Merchant Tied Coin Pouch Bag)
  shop: {
    palette: {
      K: '#1c120c',
      G: '#15803d',
      L: '#22c55e',
      Y: '#eab308',
      W: '#fef08a',
      R: '#b91c1c',
    },
    grid: [
      '....KKKKKKKK....',
      '...KYYLLLLYYK...',
      '....KKRRRRKK....',
      '.....KKKKKK.....',
      '...KKGGGGGGKK...',
      '..KGGLLLLLLGGK..',
      '.KGGLLYYYYLLGGK.',
      '.KGGLYWWWWYLGGK.',
      '.KGGLYWWWWYLGGK.',
      '.KGGLLYYYYLLGGK.',
      '..KGGGGGGGGGGK..',
      '...KKKKKKKKKK...',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  // 未知事件：醒目深紫描边大问号 (Bold Dark-Ink Question Mark '?')
  event: {
    palette: {
      K: '#1c120c',
      P: '#7e22ce',
      L: '#c084fc',
      Y: '#facc15',
    },
    grid: [
      '....KKKKKKKK....',
      '..KKPPPPPPPPKK..',
      '.KPPPLLLLLLPPPK.',
      '.KPPLKKKKKKLPPK.',
      '.KKKK.....KPPPK.',
      '.........KPPPK..',
      '........KPPPK...',
      '.......KPPPK....',
      '.......KKKK.....',
      '................',
      '.......KKKK.....',
      '......KYYYYK....',
      '......KYYYYK....',
      '.......KKKK.....',
      '................',
      '................',
    ],
  },
  // 首领：巨型王冠与深渊魔角徽章 (Act Boss Crown & Horns Crest)
  boss: {
    palette: {
      K: '#1c120c',
      Y: '#f59e0b',
      W: '#fef08a',
      R: '#dc2626',
      D: '#7f1d1d',
    },
    grid: [
      'KK....KKKK....KK',
      'KYK..KYYYYK..KYK',
      'KYYKKYYWWYYKKYYK',
      'KYYYYYWWWWYYYYYK',
      '.KYYRYYWWYYRYYK.',
      '.KYYYYYYYYYYYYK.',
      '..KRRRRRRRRRRK..',
      '..KRKKRRRRKKRK..',
      '..KRWWKRRKWWKR..',
      '..KRRRRRRRRRRK..',
      '...KRKRRRRKRK...',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
      '................',
    ],
  },
};

export const MapNodeSprite: React.FC<{ type: string; className?: string }> = ({
  type,
  className = 'w-6 h-6',
}) => {
  const sprite = MAP_NODE_SPRITES[type] || MAP_NODE_SPRITES.combat;
  return <PixelGrid grid={sprite.grid} palette={sprite.palette} className={className} />;
};

// Large Pixel Art Treasure Chest Sprite (Closed & Opened)
export const TreasureChestSprite: React.FC<{ opened: boolean }> = ({ opened }) => {
  const palette = {
    Y: '#FACC15',
    W: '#FEF9C3',
    B: '#92400E',
    D: '#451A03',
    C: '#38BDF8',
    R: '#EF4444',
  };

  const closedGrid = [
    '................',
    '..YYYYYYYYYYYY..',
    '.YBBBBBBBBBBBBY.',
    '.YBBBBBBBBBBBBY.',
    '.YDDDDDDDDDDDDY.',
    '.YYYYYYWWYYYYYY.',
    '.YBBBBYWWYBBBBY.',
    '.YBBBBYYYYBBBBY.',
    '.YBBBBBBBBBBBBY.',
    '.YBBBBBBBBBBBBY.',
    '.YDDDDDDDDDDDDY.',
    '..YYYYYYYYYYYY..',
    '................',
  ];

  const openedGrid = [
    '....W..YY..W....',
    '..YYYYYYYYYYYY..',
    '.YDDDDDDDDDDDDY.',
    '..YYYYYYYYYYYY..',
    '..W.CCCCCCCC.W..',
    '.YYYYYYYYYYYYYY.',
    '.YCCRYYYYYYRCCY.',
    '.YBBBBYWWYBBBBY.',
    '.YBBBBYYYYBBBBY.',
    '.YBBBBBBBBBBBBY.',
    '.YDDDDDDDDDDDDY.',
    '..YYYYYYYYYYYY..',
    '................',
  ];

  return (
    <div className="w-32 h-32 bg-slate-950 border-2 border-amber-400 flex items-center justify-center p-2 shadow-[0_0_24px_rgba(251,191,36,0.45)] animate-float-slow">
      <PixelGrid
        grid={opened ? openedGrid : closedGrid}
        palette={palette}
        className="w-full h-full"
      />
    </div>
  );
};

// Radial Pixel Anvil Spark Burst for Card Upgrading
export const UpgradeParticleBurst: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = 280);
    const height = (canvas.height = 340);
    const cx = width / 2;
    const cy = height / 2;

    const palette = ['#FEF08A', '#FACC15', '#10B981', '#34D399', '#6EE7B7', '#FFFFFF'];

    const sparks = Array.from({ length: 44 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 44 + (Math.random() - 0.5) * 0.25;
      const speed = 2.2 + Math.random() * 4.8;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: Math.random() > 0.4 ? 5 : 7,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 1.0,
        decay: 0.014 + Math.random() * 0.012,
      };
    });

    let animId = 0;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = false;
      sparks.forEach((s) => {
        if (s.life <= 0) return;
        alive = true;
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.12;
        s.life -= s.decay;

        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.color;
        ctx.fillRect(Math.round(s.x / 2) * 2, Math.round(s.y / 2) * 2, s.size, s.size);
      });

      if (alive) {
        animId = requestAnimationFrame(tick);
      }
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute -inset-12 z-40 pointer-events-none flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute -top-3 px-3 py-1 bg-emerald-950 border-2 border-amber-300 text-xs font-black text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.9)] animate-float-damage whitespace-nowrap">
        ⚒️ 强化+
      </div>
    </div>
  );
};

// Commercial Black Screen Fade-In / Fade-Out Transition Overlay
export const ScreenTransitionOverlay: React.FC<{
  active: boolean;
  title?: string;
  subtitle?: string;
  iconType?: string;
}> = ({ active, title = '像素尖塔', subtitle = '', iconType = 'sword' }) => {
  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300 ${
        active ? 'opacity-100 pointer-events-auto' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center gap-4 px-10 py-8 border-2 border-amber-500/60 bg-slate-950 shadow-[0_0_60px_rgba(251,191,36,0.3)]">
        <div className="p-3 bg-slate-900 border-2 border-amber-400 animate-bounce">
          <CardPixelArt spriteType={iconType} className="w-16 h-16" />
        </div>
        <div className="text-2xl font-black tracking-widest text-amber-300">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-slate-400 tracking-wider font-mono">
            {subtitle}
          </div>
        )}
        <div className="w-48 h-2 bg-slate-900 border border-slate-700 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-pulse w-full" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Dedicated 12x12 Multi-Shaded Pixel Art Status Icons (Buffs & Debuffs)
// ============================================================================
const STATUS_SPRITE_GRIDS: Record<
  keyof StatusMap,
  { grid: string[]; palette: Record<string, string> }
> = {
  strength: {
    palette: { K: '#090D16', R: '#EF4444', D: '#991B1B', Y: '#FACC15', W: '#FEF08A' },
    grid: [
      '......YYYY..',
      '.....YWWWWY.',
      '....YWRRRRWY',
      '...KRRRRRRRK',
      '..KRRRRDRRRK',
      '.KRRRRDDRRK.',
      'KYYYRRDRRK..',
      '.KYYRRRRK...',
      '..KYYYYK....',
      '.KDDDDK.....',
      'KDDDDK......',
      '.KKKK.......',
    ],
  },
  dexterity: {
    palette: { K: '#090D16', G: '#10B981', L: '#6EE7B7', W: '#F8FAFC', Y: '#FACC15' },
    grid: [
      '.......WW...',
      '.....WWLLW..',
      '....WLLLLW..',
      '...KGGGGK...',
      '...KGGGGK...',
      '...KGGGGK...',
      '..KGGGGGGK..',
      '.KGGGLLGGGK.',
      'KGGGGGGGGGGK',
      'KYYYYYYYYYYK',
      '.KKKKKKKKKK.',
      '............',
    ],
  },
  focus: {
    palette: { K: '#090D16', C: '#06B6D4', L: '#67E8F9', W: '#FFFFFF', P: '#A855F7' },
    grid: [
      '....KKKK....',
      '..KKCCCCKK..',
      '.KCCLLLLCCK.',
      'KCCLWKKWLCCK',
      'KCLWKPPKWLCL',
      'KCLWKPPKWLCL',
      'KCCLWKKWLCCK',
      '.KCCLLLLCCK.',
      '..KKCCCCKK..',
      '....KKKK....',
      '.....CC.....',
      '............',
    ],
  },
  poison: {
    palette: { K: '#090D16', G: '#22C55E', L: '#86EFAC', D: '#14532D', P: '#A855F7' },
    grid: [
      '....L..G....',
      '..KKKKKK....',
      '.KGGGGGGK...',
      'KGLLGGGGGK..',
      'KGKGGGGKGK..',
      'KGGGGGGGGK..',
      '.KGGKGGKGK..',
      '..KGKGGKG...',
      '..KDDDDDK...',
      '...KKKKK....',
      '....G..L....',
      '............',
    ],
  },
  vulnerable: {
    palette: { K: '#090D16', P: '#A855F7', L: '#E879F9', R: '#EF4444', D: '#581C87' },
    grid: [
      '.KKKKKKKKKK.',
      'KPPPPPRPPPPK',
      'KPPLPPRPPPLK',
      'KPPPPRRPPPPK',
      '.KPPRR.PPPK.',
      '.KPP.RRPPPK.',
      '..KPP.RPPK..',
      '..KPP.RPPK..',
      '...KPR.PK...',
      '....KRRK....',
      '.....KK.....',
      '............',
    ],
  },
  weak: {
    palette: { K: '#090D16', S: '#94A3B8', D: '#475569', P: '#C084FC', Y: '#FDE047' },
    grid: [
      '.Y....P...Y.',
      '...P....Y...',
      '.......KK...',
      '......KSSK..',
      '.....KSSK...',
      '..KK.KKKK...',
      '.KSSK.......',
      'KSSK........',
      'KDDK........',
      '.KK.........',
      '............',
      '............',
    ],
  },
  burn: {
    palette: { R: '#DC2626', O: '#F97316', Y: '#FACC15', W: '#FEF9C3' },
    grid: [
      '......R.....',
      '.....ROR....',
      '....ROOOR...',
      '...ROOYOOR..',
      '..ROOYYYOOR.',
      '.ROOYYWYYOOR',
      '.ROYYWWWYYOR',
      '.ROYYWWWYYOR',
      '..ROYYYYYOR.',
      '...ROOOOOR..',
      '....RRRRR...',
      '............',
    ],
  },
  thorns: {
    palette: { K: '#090D16', G: '#16A34A', L: '#4ADE80', Y: '#FACC15', R: '#EF4444' },
    grid: [
      '..Y......Y..',
      '.YGY....YGY.',
      '..YGG..GGY..',
      '...GGGGGG...',
      'Y.GGLRRLGG.Y',
      'YGGGRYYRGGGY',
      'Y.GGLRRLGG.Y',
      '...GGGGGG...',
      '..YGG..GGY..',
      '.YGY....YGY.',
      '..Y......Y..',
      '............',
    ],
  },
  metallicize: {
    palette: { K: '#090D16', S: '#94A3B8', L: '#E2E8F0', W: '#FFFFFF', D: '#334155' },
    grid: [
      '..KKKKKKKK..',
      '.KLLLLLLLLK.',
      'KLWWWWWWWWLK',
      'KLWSSSSSSWLK',
      'KLSKDDDDKSLK',
      'KLSKDDDDKSLK',
      '.KLSKKKKSLK.',
      '..KLSSSSLK..',
      '...KDDDDK...',
      '....KKKK....',
      '............',
      '............',
    ],
  },
  retainBlock: {
    palette: { K: '#090D16', C: '#0284C7', L: '#38BDF8', Y: '#FACC15', W: '#F8FAFC' },
    grid: [
      'KK.KK..KK.KK',
      'KYYKYYYYKYYK',
      'KCCCCCCCCCCK',
      'KCLWCCCCWLCK',
      '.KCCCCCCCCK.',
      '.KCCYYYYCCK.',
      '.KCCYWWYCCK.',
      '.KCCYWWYCCK.',
      '.KCCCCCCCCK.',
      'KKKKKKKKKKKK',
      '............',
      '............',
    ],
  },
  ritual: {
    palette: { K: '#090D16', R: '#EF4444', P: '#9333EA', Y: '#FACC15', W: '#FEF08A' },
    grid: [
      '....RRRR....',
      '...RWWWW....',
      '..KKKKKKKK..',
      '.KYYYYYYYYK.',
      '.KYRRRRRRYK.',
      '..KYYYYYYK..',
      '...KYYYYK...',
      '....KYYK....',
      '...KYYYYK...',
      '..KPPPPPPK..',
      '.KKKKKKKKKK.',
      '............',
    ],
  },
  swordMastery: {
    palette: { K: '#090D16', R: '#EF4444', Y: '#FACC15', W: '#FFFFFF' },
    grid: [
      '.........RRR',
      '........RWWWR',
      '.......RWWWR',
      '......RWWWR.',
      '.....RWWWR..',
      '..Y.RWWWR...',
      '..YYWWWR....',
      '...YYYY.....',
      '..YY..YY....',
      '.Y......Y...',
      'Y...........',
      '............',
    ],
  },
  infiniteBlades: {
    palette: { K: '#090D16', G: '#10B981', L: '#6EE7B7', W: '#F8FAFC' },
    grid: [
      '.G........L.',
      'GWG......LWL',
      '.GWG....LWL.',
      '..GWG..LWL..',
      '...GWGLWL...',
      '....GWWL....',
      '...LWWG.....',
      '..LWL.GWG...',
      '.LWL...GWG..',
      'LWL.....GWG.',
      '............',
      '............',
    ],
  },
  shivBonus: {
    palette: { K: '#090D16', C: '#2DD4BF', W: '#FFFFFF', R: '#EF4444', Y: '#FACC15' },
    grid: [
      '.....RR.....',
      '..R..WW..R..',
      '.R...WW...R.',
      '.....CC.....',
      'R...CCCC...R',
      'RR.CCWWCC.RR',
      'R...CCCC...R',
      '.....YY.....',
      '.R...YY...R.',
      '..R..YY..R..',
      '.....RR.....',
      '............',
    ],
  },
  afterImage: {
    palette: { K: '#090D16', I: '#6366F1', L: '#A5B4FC', C: '#38BDF8' },
    grid: [
      '...IIII.....',
      '..ILLLLI.CCC',
      '..ILLLLI.CCC',
      '...IIII..CCC',
      '.IIIIIIII.CC',
      'IILLLLLLII.C',
      'IILLLLLLII.C',
      '.IIIIIIII...',
      '..II..II.C..',
      '..II..II.C..',
      '............',
      '............',
    ],
  },
  feelNoPain: {
    palette: { K: '#090D16', S: '#94A3B8', C: '#38BDF8', Y: '#FACC15', W: '#FFFFFF' },
    grid: [
      '..KKKKKKKK..',
      '.KCCCCCCCCK.',
      'KCCWWWWWWCCK',
      'KCWYYYYYYWCK',
      'KCWYSSSSYWCK',
      '.KCYSSSSYCK.',
      '.KCCYYYYCCK.',
      '..KCCCCCCK..',
      '...KCCCCK...',
      '....KKKK....',
      '............',
      '............',
    ],
  },
  darkEmbrace: {
    palette: { K: '#020617', P: '#9333EA', L: '#E879F9', R: '#EF4444' },
    grid: [
      '.PP......PP.',
      'PLLP....PLLP',
      'PLLLP..PLLLP',
      '.PLLLPPLLLP.',
      '..PLLRRLLP..',
      '..PLRRRRLL..',
      '...PPPPPP...',
      '..P.PPPP.P..',
      '.P..PPPP..P.',
      '....PPPP....',
      '............',
      '............',
    ],
  },
  rupture: {
    palette: { K: '#090D16', R: '#DC2626', L: '#FCA5A5', Y: '#FACC15' },
    grid: [
      '....R..R....',
      '...RR..RR...',
      '..RRL..LRR..',
      '.RRRYYYYRRR.',
      'RRRYYLLYYRRR',
      'RRRYYLLYYRRR',
      '.RRRYYYYRRR.',
      '..RRRRRRRR..',
      '...RR..RR...',
      '..R......R..',
      '............',
      '............',
    ],
  },
  loopOrb: {
    palette: { C: '#22D3EE', W: '#FFFFFF', Y: '#FACC15', P: '#A855F7' },
    grid: [
      '...CCCCCC...',
      '..CCWWWWCC..',
      '.CCW....WCC.',
      'CCW..YY..WCC',
      'CW..YYYY..WC',
      'CW..YYYY..WC',
      'CCW..YY..WCC',
      '.CCW....WCC.',
      '..CCWWWWCC..',
      '...CCCCCC...',
      '............',
      '............',
    ],
  },
  stormPower: {
    palette: { Y: '#FACC15', W: '#FEF9C3', C: '#38BDF8', B: '#0284C7' },
    grid: [
      '.....YYYYY..',
      '....YWWWWY..',
      '...YWWWWY...',
      '..YWWWWYYYY.',
      '.YYYYYWWWWY.',
      '....YWWWWY..',
      '...YWWY.....',
      '..YWWY.CCCC.',
      '.YWWY.CCCCCC',
      '.YYY........',
      '............',
      '............',
    ],
  },
  noxiousFumes: {
    palette: { G: '#22C55E', L: '#86EFAC', P: '#9333EA', D: '#14532D' },
    grid: [
      '....GGGG....',
      '..GGLLLLGG..',
      '.GLLGGGGLLG.',
      'GLLGPPPPGLLG',
      'GLGGPPPPGLGG',
      '.GGGGGGGGGG.',
      '..DDD..DDD..',
      '.G..G..G..G.',
      '..GG....GG..',
      '............',
      '............',
      '............',
    ],
  },
  envenom: {
    palette: { G: '#10B981', L: '#6EE7B7', W: '#F8FAFC', P: '#A855F7' },
    grid: [
      '.........GGG',
      '........GLLG',
      '.......GLLG.',
      '......GWWG..',
      '.....GWWG...',
      '..P.GWWG.G..',
      '..PPGGG..L..',
      '...PPP......',
      '..P..P......',
      '.P..........',
      '............',
      '............',
    ],
  },
  thousandCuts: {
    palette: { R: '#EF4444', Y: '#FACC15', W: '#FFFFFF' },
    grid: [
      'W.........W.',
      '.W...Y...W..',
      '..W..Y..W...',
      '...W.Y.W....',
      'YYYYRWRYYYY.',
      '...W.Y.W....',
      '..W..Y..W...',
      '.W...Y...W..',
      'W.........W.',
      '............',
      '............',
      '............',
    ],
  },
};

export const StatusPixelIcon: React.FC<{
  statusKey: keyof StatusMap;
  className?: string;
}> = ({ statusKey, className = 'w-4 h-4' }) => {
  const sprite = STATUS_SPRITE_GRIDS[statusKey] || STATUS_SPRITE_GRIDS.strength;
  return <PixelGrid grid={sprite.grid} palette={sprite.palette} className={className} />;
};

export interface StatusMetaInfo {
  key: keyof StatusMap;
  label: string;
  isBuff: boolean;
  badgeStyle: string;
  popupStyle: string;
  describe: (val: number) => string;
}

export const STATUS_META: Record<keyof StatusMap, StatusMetaInfo> = {
  strength: {
    key: 'strength',
    label: '力量',
    isBuff: true,
    badgeStyle: 'bg-red-950/95 border-red-400 text-red-100 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    popupStyle: 'bg-red-950 border-yellow-300 text-yellow-200 shadow-[0_0_20px_rgba(239,68,68,0.95)]',
    describe: (v) => `所有攻击造成的伤害提升 +${v}`,
  },
  dexterity: {
    key: 'dexterity',
    label: '敏捷',
    isBuff: true,
    badgeStyle: 'bg-emerald-950/95 border-emerald-400 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    popupStyle: 'bg-emerald-950 border-emerald-300 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.95)]',
    describe: (v) => `所有卡牌获得的格挡提升 +${v}`,
  },
  focus: {
    key: 'focus',
    label: '集中',
    isBuff: true,
    badgeStyle: 'bg-cyan-950/95 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
    popupStyle: 'bg-cyan-950 border-cyan-300 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.95)]',
    describe: (v) => `所有充能球的被动与激发数值提升 +${v}`,
  },
  poison: {
    key: 'poison',
    label: '中毒',
    isBuff: false,
    badgeStyle: 'bg-green-950/95 border-lime-400 text-lime-200 shadow-[0_0_12px_rgba(132,204,22,0.6)]',
    popupStyle: 'bg-green-950 border-lime-300 text-lime-200 shadow-[0_0_22px_rgba(132,204,22,0.95)]',
    describe: (v) => `每回合开始失去 ${v} 点生命（无视护盾），随后层数 -1`,
  },
  vulnerable: {
    key: 'vulnerable',
    label: '脆弱',
    isBuff: false,
    badgeStyle: 'bg-purple-950/95 border-fuchsia-400 text-fuchsia-200 shadow-[0_0_12px_rgba(217,70,239,0.6)]',
    popupStyle: 'bg-purple-950 border-fuchsia-300 text-fuchsia-200 shadow-[0_0_22px_rgba(217,70,239,0.95)]',
    describe: (v) => `受到的攻击伤害提升 50%，持续 ${v} 回合`,
  },
  weak: {
    key: 'weak',
    label: '虚弱',
    isBuff: false,
    badgeStyle: 'bg-slate-900/95 border-indigo-400 text-indigo-200 shadow-[0_0_10px_rgba(129,140,248,0.5)]',
    popupStyle: 'bg-slate-900 border-indigo-300 text-indigo-200 shadow-[0_0_20px_rgba(129,140,248,0.9)]',
    describe: (v) => `攻击造成的伤害降低 25%，持续 ${v} 回合`,
  },
  burn: {
    key: 'burn',
    label: '灼烧',
    isBuff: false,
    badgeStyle: 'bg-orange-950/95 border-orange-400 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.6)]',
    popupStyle: 'bg-orange-950 border-yellow-300 text-orange-200 shadow-[0_0_20px_rgba(249,115,22,0.95)]',
    describe: (v) => `受到持续烈焰灼烧伤害 (${v} 层)`,
  },
  thorns: {
    key: 'thorns',
    label: '荆棘',
    isBuff: true,
    badgeStyle: 'bg-amber-950/95 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.5)]',
    popupStyle: 'bg-amber-950 border-yellow-300 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.9)]',
    describe: (v) => `受到攻击时向攻击者反弹 ${v} 点伤害`,
  },
  metallicize: {
    key: 'metallicize',
    label: '金属化',
    isBuff: true,
    badgeStyle: 'bg-slate-800/95 border-sky-300 text-sky-100 shadow-[0_0_10px_rgba(125,211,252,0.5)]',
    popupStyle: 'bg-slate-900 border-sky-300 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.9)]',
    describe: (v) => `每回合结束时自动获得 +${v} 点格挡`,
  },
  retainBlock: {
    key: 'retainBlock',
    label: '壁垒',
    isBuff: true,
    badgeStyle: 'bg-sky-950/95 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.5)]',
    popupStyle: 'bg-sky-950 border-yellow-300 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.9)]',
    describe: (v) => `回合开始时保留最多 ${v} 点未消耗的格挡`,
  },
  ritual: {
    key: 'ritual',
    label: '仪式',
    isBuff: true,
    badgeStyle: 'bg-rose-950/95 border-rose-400 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
    popupStyle: 'bg-rose-950 border-amber-300 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.9)]',
    describe: (v) => `每回合结束时自动获得 +${v} 点力量`,
  },
  swordMastery: {
    key: 'swordMastery',
    label: '剑宗',
    isBuff: true,
    badgeStyle: 'bg-red-950/95 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.5)]',
    popupStyle: 'bg-red-950 border-amber-300 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.9)]',
    describe: (v) => `每回合开始自动获得 +${v} 层剑意`,
  },
  infiniteBlades: {
    key: 'infiniteBlades',
    label: '刃舞',
    isBuff: true,
    badgeStyle: 'bg-teal-950/95 border-teal-400 text-teal-200 shadow-[0_0_10px_rgba(45,212,191,0.5)]',
    popupStyle: 'bg-teal-950 border-teal-300 text-teal-200 shadow-[0_0_20px_rgba(45,212,191,0.9)]',
    describe: (v) => `每回合开始自动向手牌加入 ${v} 张【闪击飞刀】`,
  },
  shivBonus: {
    key: 'shivBonus',
    label: '精准',
    isBuff: true,
    badgeStyle: 'bg-emerald-950/95 border-teal-300 text-teal-200 shadow-[0_0_10px_rgba(45,212,191,0.5)]',
    popupStyle: 'bg-emerald-950 border-yellow-300 text-teal-200 shadow-[0_0_20px_rgba(45,212,191,0.9)]',
    describe: (v) => `所有【闪击飞刀】造成的伤害提升 +${v}`,
  },
  afterImage: {
    key: 'afterImage',
    label: '残影',
    isBuff: true,
    badgeStyle: 'bg-indigo-950/95 border-indigo-400 text-indigo-200 shadow-[0_0_10px_rgba(129,140,248,0.5)]',
    popupStyle: 'bg-indigo-950 border-cyan-300 text-indigo-200 shadow-[0_0_20px_rgba(129,140,248,0.9)]',
    describe: (v) => `每打出 1 张卡牌自动获得 +${v} 点格挡`,
  },
  feelNoPain: {
    key: 'feelNoPain',
    label: '无痛',
    isBuff: true,
    badgeStyle: 'bg-sky-950/95 border-cyan-300 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
    popupStyle: 'bg-sky-950 border-yellow-300 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.95)]',
    describe: (v) => `每当有卡牌被【消耗】时，自动获得 +${v} 点格挡`,
  },
  darkEmbrace: {
    key: 'darkEmbrace',
    label: '暗拥',
    isBuff: true,
    badgeStyle: 'bg-purple-950/95 border-purple-400 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    popupStyle: 'bg-purple-950 border-amber-300 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.95)]',
    describe: (v) => `每当有卡牌被【消耗】时，自动抽 ${v} 张牌`,
  },
  rupture: {
    key: 'rupture',
    label: '撕裂',
    isBuff: true,
    badgeStyle: 'bg-red-950/95 border-rose-400 text-rose-100 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
    popupStyle: 'bg-red-950 border-yellow-300 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.95)]',
    describe: (v) => `每当从卡牌效果失去生命时，永久获得 +${v} 点力量`,
  },
  loopOrb: {
    key: 'loopOrb',
    label: '循环',
    isBuff: true,
    badgeStyle: 'bg-cyan-950/95 border-sky-300 text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.5)]',
    popupStyle: 'bg-cyan-950 border-yellow-300 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.95)]',
    describe: (v) => `每回合额外触发首枚充能球被动效果 ${v} 次`,
  },
  stormPower: {
    key: 'stormPower',
    label: '雷暴',
    isBuff: true,
    badgeStyle: 'bg-amber-950/95 border-yellow-300 text-yellow-100 shadow-[0_0_10px_rgba(250,204,21,0.5)]',
    popupStyle: 'bg-amber-950 border-yellow-200 text-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.95)]',
    describe: (v) => `每打出 1 张能力牌，自动生成 ${v} 枚雷霆充能球`,
  },
  noxiousFumes: {
    key: 'noxiousFumes',
    label: '毒雾',
    isBuff: true,
    badgeStyle: 'bg-emerald-950/95 border-lime-400 text-lime-200 shadow-[0_0_10px_rgba(132,204,22,0.5)]',
    popupStyle: 'bg-emerald-950 border-lime-300 text-lime-200 shadow-[0_0_20px_rgba(132,204,22,0.95)]',
    describe: (v) => `每回合自动对所有敌人施加 +${v} 层中毒`,
  },
  envenom: {
    key: 'envenom',
    label: '涂毒',
    isBuff: true,
    badgeStyle: 'bg-green-950/95 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    popupStyle: 'bg-green-950 border-emerald-300 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.95)]',
    describe: (v) => `每次攻击造成伤害时，额外对目标附加 +${v} 层中毒`,
  },
  thousandCuts: {
    key: 'thousandCuts',
    label: '千刃',
    isBuff: true,
    badgeStyle: 'bg-rose-950/95 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.5)]',
    popupStyle: 'bg-rose-950 border-yellow-300 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.95)]',
    describe: (v) => `每打出 1 张卡牌，自动对所有敌人造成 ${v} 点伤害`,
  },
};

export const STATUS_DISPLAY_ORDER: (keyof StatusMap)[] = [
  'strength',
  'dexterity',
  'focus',
  'poison',
  'vulnerable',
  'weak',
  'burn',
  'thorns',
  'metallicize',
  'retainBlock',
  'ritual',
  'swordMastery',
  'infiniteBlades',
  'shivBonus',
  'afterImage',
  'feelNoPain',
  'darkEmbrace',
  'rupture',
  'loopOrb',
  'stormPower',
  'noxiousFumes',
  'envenom',
  'thousandCuts',
];

export interface StatusPopupItem {
  id: string;
  targetId: string; // 'player' or enemy.uid
  statusKey: keyof StatusMap;
  delta: number;
  prevVal: number;
  newVal: number;
  staggerIdx: number;
}

// Bouncy Floating Status Popups above Player or Enemy when Buff/Debuff is gained/updated
export const FloatingStatusPopups: React.FC<{
  popups: StatusPopupItem[];
}> = ({ popups }) => {
  return (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 pointer-events-none">
      <AnimatePresence>
        {popups.map((item) => {
          const meta = STATUS_META[item.statusKey];
          const isStackUpdate = item.prevVal > 0 && item.newVal !== item.prevVal;
          const sign = item.delta > 0 ? `+${item.delta}` : `${item.delta}`;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 18, scale: 0.3 }}
              animate={{
                opacity: [0, 1, 1, 1, 0],
                y: [18, -22, -10, -28, -46],
                scale: [0.3, 1.32, 0.94, 1.14, 0.86],
              }}
              exit={{ opacity: 0, y: -52, scale: 0.75 }}
              transition={{
                duration: 1.25,
                delay: item.staggerIdx * 0.11,
                times: [0, 0.22, 0.42, 0.68, 1],
                ease: 'easeOut',
              }}
              className={`px-2.5 py-1 border-2 ${meta.popupStyle} flex items-center gap-1.5 whitespace-nowrap shadow-[0_4px_0_#000]`}
            >
              <StatusPixelIcon statusKey={item.statusKey} className="w-4 h-4 shrink-0" />
              <span className="text-xs font-black tracking-wide">
                {meta.isBuff ? '▲' : '▼'}
                {meta.label}
              </span>
              <span className="text-xs font-black font-mono text-white">
                {sign}
                {isStackUpdate ? ` (${item.prevVal}➔${item.newVal})` : ''}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Dynamic Interactive Status Bar beneath Hero or Enemy
export const DynamicStatusBar: React.FC<{
  statuses: StatusMap;
  align?: 'center' | 'left';
}> = ({ statuses, align = 'center' }) => {
  const activeKeys = STATUS_DISPLAY_ORDER.filter((k) => statuses[k] > 0);

  if (activeKeys.length === 0) {
    return <div className="min-h-[26px]" />;
  }

  return (
    <div
      className={`mt-1.5 min-h-[26px] flex flex-wrap items-center ${
        align === 'center' ? 'justify-center' : 'justify-start'
      } gap-1.5`}
    >
      <AnimatePresence mode="popLayout">
        {activeKeys.map((key) => {
          const val = statuses[key];
          const meta = STATUS_META[key];

          return (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, scale: 0.25, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.2, y: -8 }}
              transition={{
                type: 'spring',
                stiffness: 520,
                damping: 22,
              }}
              className={`group relative px-2 py-0.5 border-2 ${meta.badgeStyle} flex items-center gap-1 cursor-help select-none`}
            >
              <StatusPixelIcon statusKey={key} className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-black">{meta.label}</span>

              {/* Dynamic Number with Spring Bounce Keyed on Value Update */}
              <motion.span
                key={`${key}_${val}`}
                initial={{ scale: 1.65, y: -5, color: '#FEF08A' }}
                animate={{ scale: 1, y: 0, color: '#FFFFFF' }}
                transition={{
                  type: 'spring',
                  stiffness: 560,
                  damping: 18,
                }}
                className="text-xs font-black font-mono leading-none px-0.5"
              >
                {val}
              </motion.span>

              {/* Hover Pixel Tooltip */}
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-44 p-2 bg-slate-950 border-2 border-amber-400 text-left z-50 shadow-[0_6px_0_#000] pointer-events-none">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                  <StatusPixelIcon statusKey={key} className="w-4 h-4" />
                  <span>
                    {meta.label} ({meta.isBuff ? '增益 Buff' : '减益 Debuff'})
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-200 mt-1 leading-snug">
                  {meta.describe(val)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Dynamic Combat Background Pixel Elements (Morphs on Boss Phase 2 Berserk!)
// ============================================================================
const BG_MOON_NORMAL = {
  palette: {
    K: '#020617',
    B: '#1E293B',
    C: '#38BDF8',
    L: '#BAE6FD',
    W: '#F8FAFC',
  },
  grid: [
    '....KKKKKKKK....',
    '..KKCCCCCCCCKK..',
    '.KCCLLLLLLLLCCK.',
    'KCCLLWWWWWWLLCCK',
    'KCLWWWWWWWWWWLCK',
    'KCLWWBBBBWWWWLCK',
    'KCLWBBBBBBWWWLCK',
    'KCLWBBBBBBWWWLCK',
    'KCLWWBBBBWWWWLCK',
    'KCLWWWWWWWWWWLCK',
    'KCCLLWWWWWWLLCCK',
    '.KCCLLLLLLLLCCK.',
    '..KKCCCCCCCCKK..',
    '....KKKKKKKK....',
  ],
};

const BG_MOON_BERSERK_ECLIPSE = {
  palette: {
    K: '#1F0404',
    D: '#7F1D1D',
    R: '#EF4444',
    O: '#F97316',
    Y: '#FDE047',
  },
  grid: [
    '..Y.KKKKKKKK.Y..',
    '.YKKRRRRRRRRKKY.',
    '.KRRROOOOOORRRK.',
    'KRROYYYYYYYYOORK',
    'KROYKKKKKKKKYORK',
    'KROYKKKKKKKKYORK',
    'KROYKKKKKKKKYORK',
    'KROYKKKKKKKKYORK',
    'KROYKKKKKKKKYORK',
    'KROYKKKKKKKKYORK',
    'KRROYYYYYYYYOORK',
    '.KRRROOOOOORRRK.',
    '.YKKRRRRRRRRKKY.',
    '..Y.KKKKKKKK.Y..',
  ],
};

const BG_PILLAR_NORMAL = {
  palette: {
    K: '#020617',
    D: '#1E293B',
    S: '#475569',
    L: '#94A3B8',
    C: '#38BDF8',
    W: '#E0F2FE',
  },
  grid: [
    '.....CC..CC.....',
    '....CWWCCWWC....',
    '....CCCCCCCC....',
    '..KKKKKKKKKKKK..',
    '.KLLLLLLLLLLLLK.',
    '.KSSSSSSSSSSSSK.',
    '..KSSKDDDDKSSK..',
    '..KSSKDDDDKSSK..',
    '..KSSKDDDDKSSK..',
    '..KSSKDDDDKSSK..',
    '..KSSKDDDDKSSK..',
    '..KSSKDDDDKSSK..',
    '..KSSKDDDDKSSK..',
    '..KSSKDDDDKSSK..',
    '.KSSSSSSSSSSSSK.',
    '.KKKKKKKKKKKKKK.',
  ],
};

const BG_PILLAR_BERSERK = {
  palette: {
    K: '#1A0505',
    D: '#450A0A',
    S: '#7F1D1D',
    R: '#EF4444',
    O: '#F97316',
    Y: '#FACC15',
    W: '#FEF9C3',
  },
  grid: [
    '...R..YWWY..R...',
    '..ROROYYYYOROR..',
    '..RROOYYYYOORR..',
    '..KKKKKKKKKKKK..',
    '.KRRRRRRRRRRRRK.',
    '.KSSSRROORRSSSK.',
    '..KSSKRYYRKSSK..',
    '..KSRRODDORRSK..',
    '..KSSKROORKSSK..',
    '..KSSKRYYRKSSK..',
    '..KSRRODDORRSK..',
    '..KSSKROORKSSK..',
    '..KSSKRYYRKSSK..',
    '..KSSKDDDDKSSK..',
    '.KSSSRRRRRRSSSK.',
    '.KKKKKKKKKKKKKK.',
  ],
};

const BG_LAVA_SPIKE_GRID = {
  palette: {
    K: '#180404',
    D: '#450A0A',
    R: '#DC2626',
    O: '#F97316',
    Y: '#FACC15',
  },
  grid: [
    '.......KK.......',
    '......KRRK......',
    '.....KROORK.....',
    '....KROYYORK....',
    '...KDDROORDDK...',
    '..KDDDRYYRDDDK..',
    '.KDDDDRYYRDDDDK.',
    'KDDDDROOOORDDDDK',
    'KDDDRRYYYYRRDDDK',
    'KKKKKKKKKKKKKKKK',
  ],
};

const BG_BLOOD_LIGHTNING_GRID = {
  palette: {
    R: '#EF4444',
    O: '#F97316',
    Y: '#FDE047',
    W: '#FFFFFF',
  },
  grid: [
    '.......RRWY.....',
    '......RROWW.....',
    '.....RROWW......',
    '....RROWW.......',
    '...RROYYYYYY....',
    '.....RROWWY.....',
    '....RROWW.......',
    '...RROWW........',
    '..RROWW.........',
    '.RROYY..........',
    'RROY............',
    'RR..............',
  ],
};

export const CombatBackgroundPixelElements: React.FC<{
  isBossEncounter: boolean;
  isBossBerserk: boolean;
  act: number;
}> = ({ isBossEncounter, isBossBerserk }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-[2]">
      {/* 1. Crimson Vignette & Blood Sky Overlay when Boss is in Phase 2 Berserk */}
      <AnimatePresence>
        {isBossBerserk && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Pulsing Blood Red radial atmospheric filter */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(220,38,38,0.28),rgba(127,29,29,0.58)_65%,rgba(24,4,4,0.88)_100%)] animate-pulse" />
            {/* Crimson scanline grid overlay */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(239,68,68,0.28) 0px, rgba(239,68,68,0.28) 2px, transparent 2px, transparent 6px)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Upper Sky Pixel Celestial Body: Calm Astral Moon -> Crimson Blood Eclipse */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <motion.div
          animate={
            isBossBerserk
              ? { scale: [1, 1.14, 1.05], rotate: [0, 4, -4, 0] }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className={`relative p-1.5 rounded-none ${
            isBossBerserk
              ? 'drop-shadow-[0_0_28px_rgba(239,68,68,0.95)]'
              : 'opacity-70 drop-shadow-[0_0_16px_rgba(56,189,248,0.5)]'
          }`}
        >
          <PixelGrid
            grid={isBossBerserk ? BG_MOON_BERSERK_ECLIPSE.grid : BG_MOON_NORMAL.grid}
            palette={
              isBossBerserk ? BG_MOON_BERSERK_ECLIPSE.palette : BG_MOON_NORMAL.palette
            }
            className={isBossBerserk ? 'w-20 h-20' : 'w-14 h-14'}
          />
        </motion.div>

        {isBossBerserk && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 px-3 py-0.5 bg-red-950/90 border border-red-400/80 text-[10px] font-black text-red-200 tracking-widest shadow-[0_0_16px_rgba(239,68,68,0.8)]"
          >
            🩸 猩红血月蚀 · 首领狂暴领域开启 (力量/护甲暴涨)
          </motion.div>
        )}
      </div>

      {/* 3. Jagged Pixel Blood Lightning Bolts in Sky during Berserk Phase */}
      {isBossBerserk && (
        <>
          <div className="absolute top-4 left-[20%] animate-blood-lightning">
            <PixelGrid
              grid={BG_BLOOD_LIGHTNING_GRID.grid}
              palette={BG_BLOOD_LIGHTNING_GRID.palette}
              className="w-16 h-20"
            />
          </div>
          <div
            className="absolute top-6 right-[20%] animate-blood-lightning"
            style={{ animationDelay: '1.4s', transform: 'scaleX(-1)' }}
          >
            <PixelGrid
              grid={BG_BLOOD_LIGHTNING_GRID.grid}
              palette={BG_BLOOD_LIGHTNING_GRID.palette}
              className="w-16 h-20"
            />
          </div>
        </>
      )}

      {/* 4. Left & Right Gothic Stone Spire Pillars -> Fractured Hellfire Magma Pillars */}
      <div className="absolute left-3 bottom-12 flex flex-col items-center opacity-85">
        {isBossBerserk && (
          <div className="mb-1 px-1.5 py-0.5 bg-red-950/90 border border-orange-400 text-[9px] font-black text-amber-300 animate-bounce">
            🔥 狱火图腾
          </div>
        )}
        <PixelGrid
          grid={isBossBerserk ? BG_PILLAR_BERSERK.grid : BG_PILLAR_NORMAL.grid}
          palette={isBossBerserk ? BG_PILLAR_BERSERK.palette : BG_PILLAR_NORMAL.palette}
          className={`transition-all duration-500 ${
            isBossBerserk
              ? 'w-20 h-28 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]'
              : 'w-16 h-24 opacity-60'
          }`}
        />
      </div>

      <div className="absolute right-3 bottom-12 flex flex-col items-center opacity-85">
        {isBossBerserk && (
          <div className="mb-1 px-1.5 py-0.5 bg-red-950/90 border border-orange-400 text-[9px] font-black text-amber-300 animate-bounce">
            🔥 狱火图腾
          </div>
        )}
        <PixelGrid
          grid={isBossBerserk ? BG_PILLAR_BERSERK.grid : BG_PILLAR_NORMAL.grid}
          palette={isBossBerserk ? BG_PILLAR_BERSERK.palette : BG_PILLAR_NORMAL.palette}
          className={`transition-all duration-500 ${
            isBossBerserk
              ? 'w-20 h-28 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]'
              : 'w-16 h-24 opacity-60'
          }`}
        />
      </div>

      {/* 5. Floor Horizon: Calm Stone Bricks -> Erupting Obsidian Spikes & Magma Fissure */}
      <div className="absolute inset-x-0 bottom-0 h-12 flex items-end justify-between px-16">
        {isBossBerserk ? (
          <>
            {Array.from({ length: 8 }).map((_, idx) => (
              <motion.div
                key={`spike_${idx}`}
                initial={{ y: 36, opacity: 0 }}
                animate={{
                  y: [0, -4, 0],
                  opacity: 0.92,
                }}
                transition={{
                  y: {
                    duration: 1.4 + (idx % 3) * 0.3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  opacity: { duration: 0.35, delay: idx * 0.05 },
                }}
                className="drop-shadow-[0_0_12px_rgba(239,68,68,0.85)]"
              >
                <PixelGrid
                  grid={BG_LAVA_SPIKE_GRID.grid}
                  palette={BG_LAVA_SPIKE_GRID.palette}
                  className={idx % 2 === 0 ? 'w-12 h-8' : 'w-10 h-6'}
                />
              </motion.div>
            ))}
            {/* Glowing Magma Fault Line across bottom edge */}
            <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-red-900 via-orange-500 to-red-900 shadow-[0_0_24px_rgba(249,115,22,0.95)] animate-pulse" />
          </>
        ) : (
          isBossEncounter && (
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-500/35 to-transparent" />
          )
        )}
      </div>
    </div>
  );
};


