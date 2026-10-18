export default function Illustration({ compact = false }: { compact?: boolean }) {
  return <svg className={`illustration ${compact ? 'compact' : ''}`} viewBox="0 0 520 510" fill="none" role="img" aria-label="A curious explorer holding a little book, surrounded by a heart, a leaf, and a spark of discovery">
    <defs><pattern id="grain" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#661414" opacity=".09" /></pattern></defs>
    <path d="M81 402V210C81 103 157 38 260 38s179 66 179 172v192H81Z" fill="#e6cbbd" />
    <path d="M81 402V210C81 103 157 38 260 38s179 66 179 172v192H81Z" fill="url(#grain)" />
    <circle cx="264" cy="217" r="143" stroke="#b58777" strokeDasharray="3 9" opacity=".6" />
    <ellipse cx="264" cy="440" rx="181" ry="22" fill="#661414" opacity=".08" />
    <path d="M144 430c9-105 33-169 113-173 86-4 113 83 124 173H144Z" fill="#661414" />
    <path d="m215 272 40 60 44-60" fill="#f8f2eb" />
    <path d="m210 275 19 121m75-121-14 121" stroke="#a86755" strokeWidth="3" />
    <path d="M178 195c-4-85 22-120 77-119 56 1 78 37 71 108l-15 83-123 2-10-74Z" fill="#351d1d" />
    <path d="M231 241v38c13 15 31 17 46 0v-38" fill="#c88767" />
    <path d="M195 157c-6 66 18 104 59 106 43 1 65-40 61-104-41 15-73-5-86-33-7 17-19 27-34 31Z" fill="#e7ae8b" />
    <path d="M196 175c-27-14-28 27 2 28m115-28c27-14 25 26-2 28" fill="#e7ae8b" />
    <path d="M213 170c6-3 12-3 18-1m45 0c7-3 13-3 18 0" stroke="#351d1d" strokeWidth="4" strokeLinecap="round" />
    <ellipse cx="223" cy="185" rx="3.5" ry="5" fill="#351d1d" /><ellipse cx="284" cy="185" rx="3.5" ry="5" fill="#351d1d" />
    <path d="m253 188-4 15h8m-20 15c10 11 23 11 34-2" stroke="#8c3d2d" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="214" cy="204" rx="10" ry="5" fill="#c04e2a" opacity=".25" /><ellipse cx="292" cy="204" rx="10" ry="5" fill="#c04e2a" opacity=".25" />
    <path d="M175 321c-5 32 7 66 31 70l46-27m79-43c7 24 6 52-15 66l-42-24" stroke="#e7ae8b" strokeWidth="23" strokeLinecap="round" />
    <path d="m216 311 47 11 47-11v84l-47 14-47-14v-84Z" fill="#f5ebdf" stroke="#b58777" strokeWidth="2" /><path d="M263 322v87" stroke="#b58777" strokeWidth="2" />
    <path d="m275 342 21-6m-21 17 21-6m-21 17 16-5m-43-22-17-5m17 17-17-5" stroke="#b58777" strokeWidth="3" strokeLinecap="round" />
    <path d="m219 357 14 5m-14 3 13 5m72-12-14 5m14 3-13 5" stroke="#e7ae8b" strokeWidth="9" strokeLinecap="round" />
    <g className="float-one"><rect x="35" y="154" width="90" height="95" rx="23" fill="#f8f2eb" transform="rotate(-12 35 154)" /><path d="M73 177c-13-14-31 5-18 19l21 18 18-24c12-16-10-30-21-13Z" fill="#c04e2a" /></g>
    <g className="float-two"><rect x="389" y="241" width="90" height="96" rx="23" fill="#f8f2eb" transform="rotate(12 389 241)" /><path d="M413 300c-10-25 4-38 29-34 0 25-10 39-29 34Z" fill="#b58777" /><path d="m406 312 25-32" stroke="#661414" strokeWidth="3" strokeLinecap="round" /></g>
    <g stroke="#c04e2a" strokeWidth="3" strokeLinecap="round"><path d="M363 94v26m-13-13h26m-22-9 18 18m0-18-18 18M123 321v20m-10-10h20" /></g>
    <circle cx="400" cy="170" r="6" fill="#c04e2a" /><circle cx="130" cy="102" r="4" fill="#b58777" />
    <path d="M72 414c-6-27-24-50-43-52 0 28 14 45 43 52Zm0 0c2-33 21-48 39-47-1 24-16 41-39 47Z" fill="#b58777" /><path d="M72 429v-33" stroke="#661414" strokeWidth="3" />
    <path d="m393 413 40-14 20 37-40 14-20-37Z" fill="#c04e2a" /><path d="m413 415 16 13m-14 1 13-16" stroke="#f8f2eb" strokeWidth="2" />
  </svg>
}
