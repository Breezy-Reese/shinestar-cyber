import { Phone, Calendar, CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const CARDS = [
  {
    tag: 'Welcome',
    icon: '🛡️',
    color: '#1a56db',
    bg: '#dbeafe',
    tc: '#1e40af',
    title: 'Shinestar Cyber Kenya',
    sub: 'Trusted IT & cybersecurity partner since 2022.',
  },
  {
    tag: 'Courses',
    icon: '📚',
    color: '#0e9f6e',
    bg: '#d1fae5',
    tc: '#065f46',
    title: 'Professional training',
    sub: 'Cybersecurity, web dev, data analysis & more.',
  },
  {
    tag: 'Certificate',
    icon: '🏆',
    color: '#d97706',
    bg: '#fef3c7',
    tc: '#92400e',
    title: 'Gold certification',
    sub: 'Verifiable QR certificates for every graduate.',
  },
  {
    tag: 'Community',
    icon: '👥',
    color: '#7c3aed',
    bg: '#ede9fe',
    tc: '#4c1d95',
    title: '500+ students trained',
    sub: '95% success rate across Kenya.',
  },
  {
    tag: 'Apply',
    icon: '✅',
    color: '#e11d48',
    bg: '#ffe4e6',
    tc: '#9f1239',
    title: 'Apply for a course',
    sub: 'No registration — just your details.',
  },
  {
    tag: 'Support',
    icon: '💻',
    color: '#0891b2',
    bg: '#e0f2fe',
    tc: '#0e7490',
    title: 'IT support & services',
    sub: 'Government apps, printing, networking & more.',
  },
];

const N = CARDS.length;
const RADIUS = 140;

export default function Hero() {
  const [active, setActive] = useState(0);
  const rotRef = useRef(0);
  const rafRef = useRef<number>(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const place = (r: number, activeIdx: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll<HTMLDivElement>('.ring-card');
    cards.forEach((el, i) => {
      const a = r + (i / N) * Math.PI * 2;
      const cosA = Math.cos(a);
      const brightness = 0.35 + 0.65 * ((cosA + 1) / 2);
      el.style.transform = `rotateY(${-a}rad) translateZ(${RADIUS}px)`;
      el.style.opacity = String(brightness);
      el.style.zIndex = String(Math.round(brightness * 100));
      const isFront = i === activeIdx;
      el.style.border = isFront
        ? `2px solid ${CARDS[i].color}99`
        : '1px solid rgba(0,0,0,0.07)';
      el.style.boxShadow = isFront
        ? `0 8px 32px ${CARDS[i].color}44`
        : '0 2px 8px rgba(0,0,0,0.05)';
    });
  };

  const animTo = (target: number, activeIdx: number) => {
    cancelAnimationFrame(rafRef.current);
    const start = rotRef.current;
    let diff = target - start;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const t0 = performance.now();
    const frame = (t: number) => {
      const p = Math.min((t - t0) / 700, 1);
      const e = 1 - Math.pow(1 - p, 4);
      rotRef.current = start + diff * e;
      place(rotRef.current, activeIdx);
      if (p < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  };

  const goTo = (i: number) => {
    const idx = (i + N) % N;
    setActive(idx);
    animTo(-(idx / N) * Math.PI * 2, idx);
  };

  const scheduleAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % N;
        animTo(-(next / N) * Math.PI * 2, next);
        return next;
      });
    }, 3000);
  };

  useEffect(() => {
    place(0, 0);
    scheduleAuto();
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleCardClick = (i: number) => {
    if (autoRef.current) clearInterval(autoRef.current);
    goTo(i);
    scheduleAuto();
  };

  const handleStep = (dir: number) => {
    if (autoRef.current) clearInterval(autoRef.current);
    goTo(active + dir);
    scheduleAuto();
  };

  return (
    <section id="home" className="pt-20 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* ── LEFT SIDE ── */}
          <div className="space-y-6">
            <div className="inline-block">
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                Professional Tech Solutions
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              SHINESTAR CYBER
              <span className="block text-blue-600 mt-2">COMPUTERS</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Transform your business with cutting-edge cyber services, government applications, and IT solutions. We deliver excellence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="tel:0743181585"
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg"
              >
                <Phone className="w-5 h-5" />
                <span className="font-semibold">Call Now</span>
              </a>
              <Link
                to="/contact"
                className="flex items-center justify-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-lg border-2 border-blue-600 hover:bg-gray-50 transition-all duration-200 shadow-lg"
              >
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">Book Appointment</span>
              </Link>
            </div>

            {/* Trusted badge */}
            <div className="flex items-center space-x-2 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">Trusted by 1000+ clients</span>
            </div>

            {/* ── Phone numbers & hours moved here ── */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Phone numbers */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-blue-600 text-sm font-bold">Safaricom: </span>
                    <span className="text-gray-900 text-sm font-semibold">0743181585</span>
                  </div>
                  <div>
                    <span className="text-blue-600 text-sm font-bold">Airtel: </span>
                    <span className="text-gray-900 text-sm font-semibold">0731715382</span>
                  </div>
                </div>
                <div className="text-gray-500 text-xs font-medium mt-2">Call Anytime</div>
              </div>

              {/* Working hours */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                <div className="space-y-1">
                  <div>
                    <span className="text-blue-600 text-sm font-bold">Mon–Sat: </span>
                    <span className="text-gray-900 text-xs font-medium">7:00 AM – 9:00 PM</span>
                  </div>
                  <div>
                    <span className="text-blue-600 text-sm font-bold">Sunday: </span>
                    <span className="text-gray-900 text-xs font-medium">1:30 PM – 9:00 PM</span>
                  </div>
                </div>
                <div className="text-gray-500 text-xs font-medium mt-2">Working Hours</div>
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDE — 3D circular carousel ── */}
          <div className="flex flex-col items-center justify-center">
            {/* 3D ring */}
            <div
              style={{
                width: 360,
                height: 360,
                perspective: 860,
                perspectiveOrigin: '50% 48%',
                position: 'relative',
              }}
            >
              <div
                ref={containerRef}
                style={{
                  width: '100%',
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  position: 'relative',
                }}
              >
                {CARDS.map((c, i) => (
                  <div
                    key={i}
                    className="ring-card"
                    onClick={() => handleCardClick(i)}
                    style={{
                      position: 'absolute',
                      width: 115,
                      height: 185,
                      left: '50%',
                      top: '50%',
                      marginLeft: -57,
                      marginTop: -92,
                      borderRadius: 16,
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.9rem 0.65rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backfaceVisibility: 'hidden',
                      transition: 'border 0.3s, box-shadow 0.3s',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: c.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        marginBottom: 8,
                        flexShrink: 0,
                      }}
                    >
                      {c.icon}
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        background: c.bg,
                        color: c.tc,
                        padding: '3px 8px',
                        borderRadius: 20,
                        marginBottom: 6,
                      }}
                    >
                      {c.tag}
                    </span>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#111827', lineHeight: 1.3, marginBottom: 4 }}>
                      {c.title}
                    </p>
                    <p style={{ fontSize: 9.5, color: '#6b7280', lineHeight: 1.4 }}>
                      {c.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active card info panel */}
            <div className="mt-3 w-full max-w-xs bg-white rounded-2xl border border-gray-100 shadow-lg px-5 py-4 text-center">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full inline-block"
                style={{ background: CARDS[active].bg, color: CARDS[active].tc }}
              >
                {CARDS[active].tag}
              </span>
              <p className="text-sm font-semibold text-gray-900 mt-2">{CARDS[active].title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{CARDS[active].sub}</p>

              {/* dots */}
              <div className="flex justify-center gap-1.5 mt-3">
                {CARDS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleCardClick(i)}
                    style={{
                      width: i === active ? 20 : 7,
                      height: 7,
                      borderRadius: 4,
                      background: i === active ? CARDS[active].color : '#e5e7eb',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* arrows */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => handleStep(-1)}
                className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg transition-colors"
              >
                ‹
              </button>
              <span className="text-xs text-gray-400">{active + 1} / {N}</span>
              <button
                onClick={() => handleStep(1)}
                className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM STATS — unchanged ── */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">Makueni</div>
            <div className="text-sm text-gray-600 mt-1">Mtito-Andei, next to KCB</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">1000+</div>
            <div className="text-sm text-gray-600 mt-1">Happy Clients</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">2000+</div>
            <div className="text-sm text-gray-600 mt-1">Services Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">24/7</div>
            <div className="text-sm text-gray-600 mt-1">Support Available</div>
          </div>
        </div>
      </div>
    </section>
  );
}
