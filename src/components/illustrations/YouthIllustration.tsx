export function YouthIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 255"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── BACKGROUND ─────────────────────────────────────── */}

      {/* Wavy ground */}
      <path
        d="M10,238 Q80,231 150,236 Q220,241 290,235 Q360,229 430,235 Q480,239 510,234"
        stroke="#1F1B16"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.1"
      />

      {/* Sparkle — top-left */}
      <g transform="translate(28,38)">
        <line x1="0" y1="-8" x2="0" y2="8" stroke="#E85A2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="-8" y1="0" x2="8" y2="0" stroke="#E85A2A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="-5.5" y1="-5.5" x2="5.5" y2="5.5" stroke="#E85A2A" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5.5" y1="-5.5" x2="-5.5" y2="5.5" stroke="#E85A2A" strokeWidth="1.5" strokeLinecap="round"/>
      </g>

      {/* Sparkle — top-right */}
      <g transform="translate(462,28)">
        <line x1="0" y1="-9" x2="0" y2="9" stroke="#0F766E" strokeWidth="2" strokeLinecap="round"/>
        <line x1="-9" y1="0" x2="9" y2="0" stroke="#0F766E" strokeWidth="2" strokeLinecap="round"/>
        <line x1="-6" y1="-6" x2="6" y2="6" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="6" y1="-6" x2="-6" y2="6" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round"/>
      </g>

      {/* Small cross — center-top */}
      <g transform="translate(268,20)">
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#E85A2A" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-5" y1="0" x2="5" y2="0" stroke="#E85A2A" strokeWidth="1.5" strokeLinecap="round"/>
      </g>

      {/* Small cross — lower-right */}
      <g transform="translate(508,90)">
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-5" y1="0" x2="5" y2="0" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round"/>
      </g>

      {/* Floating dots */}
      <circle cx="14" cy="155" r="4.5" fill="#0F766E" opacity="0.18"/>
      <circle cx="497" cy="110" r="5" fill="#E85A2A" opacity="0.15"/>
      <circle cx="258" cy="246" r="6" fill="#E85A2A" opacity="0.12"/>


      {/* ── CHARACTER 1 — FOOTBALL PLAYER ─────────────────── */}
      {/* Ground shadow */}
      <ellipse cx="72" cy="237" rx="30" ry="6" fill="#1F1B16" opacity="0.08"/>

      {/* Football */}
      <circle cx="140" cy="225" r="14" fill="white" stroke="#1F1B16" strokeWidth="2"/>
      <path d="M140,211 L138,218 L131,221 L132,230 L140,233 L148,230 L149,221 L142,218Z" fill="#1F1B16" opacity="0.8"/>
      {/* Motion lines */}
      <line x1="122" y1="223" x2="111" y2="221" stroke="#1F1B16" strokeWidth="1.5" strokeLinecap="round" opacity="0.22"/>
      <line x1="123" y1="229" x2="110" y2="229" stroke="#1F1B16" strokeWidth="1.5" strokeLinecap="round" opacity="0.16"/>

      {/* Right leg — kicking */}
      <path d="M78,197 Q89,217 103,212 Q118,206 126,218" stroke="#F5C5A3" strokeWidth="11" strokeLinecap="round" fill="none"/>
      <path d="M78,197 Q89,217 103,212 Q118,206 126,218" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <ellipse cx="125" cy="220" rx="11" ry="5.5" fill="#E85A2A" transform="rotate(-12 125 220)"/>
      <ellipse cx="125" cy="220" rx="11" ry="5.5" stroke="#1F1B16" strokeWidth="1.5" fill="none" transform="rotate(-12 125 220)"/>

      {/* Left leg */}
      <line x1="61" y1="197" x2="54" y2="232" stroke="#F5C5A3" strokeWidth="11" strokeLinecap="round"/>
      <line x1="61" y1="197" x2="54" y2="232" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="53" cy="234" rx="11" ry="5" fill="#1F1B16"/>

      {/* Shorts */}
      <path d="M51,193 L51,206 L65,206 L68,201 L71,206 L85,206 L85,193Z" fill="#1F1B16" opacity="0.7"/>

      {/* Body — orange shirt */}
      <path d="M51,153 C41,163 42,181 49,197 L87,197 C94,181 95,163 85,153 C80,149 68,147 68,147 C68,147 56,149 51,153Z" fill="#E85A2A" stroke="#1F1B16" strokeWidth="2"/>
      {/* Shirt stripe */}
      <path d="M52,168 Q68,163 84,168" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>

      {/* Left arm — balance */}
      <path d="M51,163 Q34,169 24,180" stroke="#F5C5A3" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M51,163 Q34,169 24,180" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Right arm */}
      <path d="M85,163 Q100,159 112,164" stroke="#F5C5A3" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M85,163 Q100,159 112,164" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round" fill="none"/>

      {/* Neck */}
      <rect x="62" y="146" width="12" height="9" rx="4" fill="#F5C5A3" stroke="#1F1B16" strokeWidth="1.5"/>

      {/* Head */}
      <circle cx="68" cy="129" r="22" fill="#F5C5A3" stroke="#1F1B16" strokeWidth="2"/>
      {/* Hair — orange */}
      <path d="M47,121 C49,101 59,106 68,108 C77,106 87,101 89,121 C83,115 75,113 68,114 C61,113 53,115 47,121Z" fill="#E85A2A"/>
      {/* Eyes */}
      <circle cx="61" cy="128" r="3.5" fill="#1F1B16"/>
      <circle cx="75" cy="128" r="3.5" fill="#1F1B16"/>
      <circle cx="62.5" cy="126.5" r="1.2" fill="white"/>
      <circle cx="76.5" cy="126.5" r="1.2" fill="white"/>
      {/* Smile */}
      <path d="M61,137 Q68,143 75,137" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round" fill="none"/>


      {/* ── CHARACTER 2 — PAINTER ──────────────────────────── */}
      {/* Ground shadow */}
      <ellipse cx="228" cy="237" rx="32" ry="6" fill="#1F1B16" opacity="0.07"/>

      {/* Easel legs */}
      <line x1="193" y1="164" x2="176" y2="232" stroke="#92651A" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="193" y1="164" x2="212" y2="232" stroke="#92651A" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="193" y1="168" x2="195" y2="232" stroke="#92651A" strokeWidth="3" strokeLinecap="round"/>
      <line x1="181" y1="196" x2="207" y2="196" stroke="#92651A" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Canvas */}
      <rect x="168" y="143" width="50" height="40" rx="4" fill="#FAF6F1" stroke="#1F1B16" strokeWidth="2.5"/>
      {/* Canvas art — abstract dabs */}
      <circle cx="180" cy="156" r="7.5" fill="#E85A2A" opacity="0.72"/>
      <circle cx="198" cy="162" r="6.5" fill="#0F766E" opacity="0.68"/>
      <circle cx="186" cy="170" r="5.5" fill="#FCD34D" opacity="0.82"/>
      <circle cx="208" cy="153" r="5" fill="#E85A2A" opacity="0.5"/>
      <path d="M173,177 Q186,173 199,177" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55"/>

      {/* Paint splatters on ground */}
      <circle cx="163" cy="220" r="5" fill="#E85A2A" opacity="0.5"/>
      <circle cx="169" cy="212" r="3.5" fill="#0F766E" opacity="0.4"/>
      <circle cx="157" cy="209" r="4" fill="#FCD34D" opacity="0.5"/>
      <circle cx="174" cy="225" r="3" fill="#E85A2A" opacity="0.35"/>

      {/* Right arm — brush raised */}
      <path d="M250,160 C257,150 263,141 267,131" stroke="#C89B7B" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M250,160 C257,150 263,141 267,131" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Brush */}
      <line x1="267" y1="131" x2="276" y2="112" stroke="#92651A" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="277" cy="109" rx="4.5" ry="7" fill="#0F766E" transform="rotate(-22 277 109)"/>
      <ellipse cx="277" cy="109" rx="4.5" ry="7" stroke="#1F1B16" strokeWidth="1.5" fill="none" transform="rotate(-22 277 109)"/>

      {/* Left arm — palette */}
      <path d="M214,160 C200,165 194,173 191,182" stroke="#C89B7B" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M214,160 C200,165 194,173 191,182" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Palette */}
      <ellipse cx="187" cy="186" rx="14" ry="10" fill="#FAF6F1" stroke="#1F1B16" strokeWidth="1.5" transform="rotate(-18 187 186)"/>
      <circle cx="183" cy="183" r="3.5" fill="#E85A2A"/>
      <circle cx="192" cy="180" r="3" fill="#0F766E"/>
      <circle cx="185" cy="191" r="3" fill="#FCD34D"/>
      <circle cx="193" cy="188" r="2.5" fill="#E85A2A" opacity="0.65"/>

      {/* Body — teal shirt */}
      <path d="M214,149 C205,159 207,178 211,195 L249,195 C253,178 255,159 246,149 C241,145 232,143 232,143 C232,143 219,145 214,149Z" fill="#0F766E" stroke="#1F1B16" strokeWidth="2"/>
      <path d="M215,165 Q232,160 249,165" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>

      {/* Legs */}
      <line x1="218" y1="195" x2="212" y2="232" stroke="#C89B7B" strokeWidth="11" strokeLinecap="round"/>
      <line x1="218" y1="195" x2="212" y2="232" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round"/>
      <line x1="246" y1="195" x2="252" y2="232" stroke="#C89B7B" strokeWidth="11" strokeLinecap="round"/>
      <line x1="246" y1="195" x2="252" y2="232" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="211" cy="234" rx="11" ry="5" fill="#1F1B16"/>
      <ellipse cx="253" cy="234" rx="11" ry="5" fill="#1F1B16"/>

      {/* Neck */}
      <rect x="226" y="142" width="12" height="9" rx="4" fill="#C89B7B" stroke="#1F1B16" strokeWidth="1.5"/>

      {/* Head */}
      <circle cx="232" cy="125" r="22" fill="#C89B7B" stroke="#1F1B16" strokeWidth="2"/>
      {/* Hair — teal */}
      <path d="M211,117 C213,97 222,102 232,104 C242,102 251,97 253,117 C247,111 240,109 232,110 C224,109 217,111 211,117Z" fill="#0F766E"/>
      {/* Eyes */}
      <circle cx="225" cy="125" r="3.5" fill="#1F1B16"/>
      <circle cx="239" cy="125" r="3.5" fill="#1F1B16"/>
      <circle cx="226.5" cy="123.5" r="1.2" fill="white"/>
      <circle cx="240.5" cy="123.5" r="1.2" fill="white"/>
      {/* Smile */}
      <path d="M224,134 Q232,140 240,134" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round" fill="none"/>


      {/* ── CHARACTER 3 — LAPTOP PERSON (sitting) ──────────── */}
      {/* Cushion/mat */}
      <ellipse cx="350" cy="234" rx="36" ry="8" fill="#0F766E" opacity="0.14"/>
      <ellipse cx="350" cy="231" rx="30" ry="5.5" fill="#0F766E" stroke="#0F766E" strokeWidth="1" opacity="0.25"/>

      {/* Folded legs */}
      <path d="M322,206 Q310,217 301,226 Q320,233 350,231 Q380,233 399,226 Q390,217 378,206Z" fill="#F5C5A3" stroke="#1F1B16" strokeWidth="2"/>
      {/* Jeans */}
      <path d="M320,207 Q308,218 302,225" stroke="#3B82F6" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.55"/>
      <path d="M380,207 Q392,218 398,225" stroke="#3B82F6" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.55"/>

      {/* Laptop base */}
      <rect x="306" y="232" width="88" height="8" rx="4" fill="#374151" stroke="#1F1B16" strokeWidth="1.5"/>
      {/* Laptop screen */}
      <rect x="306" y="193" width="88" height="42" rx="5" fill="#1F1B16" stroke="#1F1B16" strokeWidth="2"/>
      <rect x="309" y="196" width="82" height="36" rx="3" fill="#2563EB" opacity="0.85"/>
      {/* Screen content */}
      <rect x="315" y="203" width="42" height="3" rx="1.5" fill="white" opacity="0.7"/>
      <rect x="315" y="209" width="34" height="2.5" rx="1" fill="white" opacity="0.5"/>
      <rect x="315" y="215" width="38" height="2.5" rx="1" fill="white" opacity="0.55"/>
      <rect x="315" y="221" width="30" height="2.5" rx="1" fill="white" opacity="0.38"/>
      <rect x="315" y="228" width="18" height="5" rx="2.5" fill="#E85A2A" opacity="0.85"/>
      {/* Cursor blink */}
      <rect x="360" y="203" width="2" height="10" rx="1" fill="white" opacity="0.6"/>

      {/* Right arm */}
      <path d="M360,175 C370,186 374,196 372,207" stroke="#F5C5A3" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M360,175 C370,186 374,196 372,207" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Left arm */}
      <path d="M322,175 C312,186 308,196 310,207" stroke="#F5C5A3" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M322,175 C312,186 308,196 310,207" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round" fill="none"/>

      {/* Body — orange shirt */}
      <path d="M322,165 C313,175 314,190 318,205 L382,205 C386,190 387,175 378,165 C373,161 361,159 350,159 C339,159 327,161 322,165Z" fill="#E85A2A" stroke="#1F1B16" strokeWidth="2"/>
      <path d="M324,180 Q350,175 376,180" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.28"/>

      {/* Neck */}
      <rect x="344" y="158" width="12" height="9" rx="4" fill="#F5C5A3" stroke="#1F1B16" strokeWidth="1.5"/>

      {/* Head */}
      <circle cx="350" cy="143" r="21" fill="#F5C5A3" stroke="#1F1B16" strokeWidth="2"/>
      {/* Dark hair + orange streak */}
      <path d="M330,135 C332,116 340,120 350,122 C360,120 368,116 370,135 C364,129 358,127 350,128 C342,127 336,129 330,135Z" fill="#1F1B16" opacity="0.88"/>
      <path d="M340,117 C343,111 357,111 360,117" stroke="#E85A2A" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      {/* Headphones */}
      <path d="M329,142 Q350,129 371,142" stroke="#1F1B16" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="329" cy="143" r="5" fill="#0F766E" stroke="#1F1B16" strokeWidth="1.5"/>
      <circle cx="371" cy="143" r="5" fill="#0F766E" stroke="#1F1B16" strokeWidth="1.5"/>
      {/* Eyes */}
      <circle cx="343" cy="143" r="3.5" fill="#1F1B16"/>
      <circle cx="357" cy="143" r="3.5" fill="#1F1B16"/>
      <circle cx="344.5" cy="141.5" r="1.2" fill="white"/>
      <circle cx="358.5" cy="141.5" r="1.2" fill="white"/>
      {/* Smile */}
      <path d="M342,152 Q350,158 358,152" stroke="#1F1B16" strokeWidth="2" strokeLinecap="round" fill="none"/>


      {/* ── CHARACTERS 4 & 5 — TABLE GROUP ─────────────────── */}
      {/* Ground shadow */}
      <ellipse cx="452" cy="237" rx="56" ry="7" fill="#1F1B16" opacity="0.07"/>

      {/* Table legs */}
      <line x1="416" y1="206" x2="411" y2="232" stroke="#92651A" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="490" y1="206" x2="495" y2="232" stroke="#92651A" strokeWidth="3.5" strokeLinecap="round"/>
      {/* Table top */}
      <rect x="403" y="196" width="98" height="11" rx="5.5" fill="#FDE68A" stroke="#1F1B16" strokeWidth="2"/>

      {/* Left cup */}
      <rect x="431" y="181" width="12" height="15" rx="3" fill="white" stroke="#1F1B16" strokeWidth="1.5"/>
      <path d="M443,185 Q448,187.5 443,190" stroke="#1F1B16" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Steam */}
      <path d="M434,179 Q436,174 434,169" stroke="#1F1B16" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3"/>
      <path d="M438,179 Q440,173 438,168" stroke="#1F1B16" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.22"/>

      {/* Right cup */}
      <rect x="461" y="181" width="12" height="15" rx="3" fill="white" stroke="#1F1B16" strokeWidth="1.5"/>
      <path d="M473,185 Q478,187.5 473,190" stroke="#1F1B16" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Steam */}
      <path d="M464,179 Q466,174 464,169" stroke="#1F1B16" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3"/>

      {/* Note on table */}
      <rect x="444" y="182" width="18" height="14" rx="2" fill="#FAF6F1" stroke="#1F1B16" strokeWidth="1.5" transform="rotate(-4 444 182)"/>
      <line x1="447" y1="188" x2="458" y2="188" stroke="#1F1B16" strokeWidth="1" opacity="0.35"/>
      <line x1="447" y1="192" x2="455" y2="192" stroke="#1F1B16" strokeWidth="1" opacity="0.25"/>

      {/* === Left person — teal hair === */}
      {/* Body */}
      <path d="M404,174 C397,183 398,192 402,198 L434,198 C438,192 439,183 432,174 C427,170 420,168 420,168 C420,168 411,170 404,174Z" fill="#0F766E" stroke="#1F1B16" strokeWidth="2"/>
      {/* Left arm on table */}
      <path d="M404,181 C408,189 413,195 417,197" stroke="#C89B7B" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M404,181 C408,189 413,195 417,197" stroke="#1F1B16" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Right arm on table */}
      <path d="M434,181 C430,189 425,195 421,197" stroke="#C89B7B" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M434,181 C430,189 425,195 421,197" stroke="#1F1B16" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Neck */}
      <rect x="414" y="167" width="12" height="8" rx="4" fill="#C89B7B" stroke="#1F1B16" strokeWidth="1.5"/>
      {/* Head */}
      <circle cx="420" cy="153" r="19" fill="#C89B7B" stroke="#1F1B16" strokeWidth="2"/>
      {/* Hair — teal */}
      <path d="M402,147 C404,130 412,134 420,136 C428,134 436,130 438,147 C432,141 427,139 420,140 C413,139 408,141 402,147Z" fill="#0F766E"/>
      {/* Eyes */}
      <circle cx="414" cy="153" r="3" fill="#1F1B16"/>
      <circle cx="426" cy="153" r="3" fill="#1F1B16"/>
      {/* Smile */}
      <path d="M413,162 Q420,167 427,162" stroke="#1F1B16" strokeWidth="1.8" strokeLinecap="round" fill="none"/>

      {/* === Right person — orange hair === */}
      {/* Body */}
      <path d="M470,174 C463,183 464,192 468,198 L500,198 C504,192 505,183 498,174 C493,170 486,168 486,168 C486,168 477,170 470,174Z" fill="#E85A2A" stroke="#1F1B16" strokeWidth="2"/>
      {/* Arms on table */}
      <path d="M470,181 C474,189 479,195 483,197" stroke="#F5C5A3" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M470,181 C474,189 479,195 483,197" stroke="#1F1B16" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M500,181 C496,189 491,195 487,197" stroke="#F5C5A3" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M500,181 C496,189 491,195 487,197" stroke="#1F1B16" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Neck */}
      <rect x="480" y="167" width="12" height="8" rx="4" fill="#F5C5A3" stroke="#1F1B16" strokeWidth="1.5"/>
      {/* Head */}
      <circle cx="486" cy="153" r="19" fill="#F5C5A3" stroke="#1F1B16" strokeWidth="2"/>
      {/* Hair — orange */}
      <path d="M468,147 C470,130 478,134 486,136 C494,134 502,130 504,147 C498,141 493,139 486,140 C479,139 474,141 468,147Z" fill="#E85A2A"/>
      {/* Eyes */}
      <circle cx="480" cy="153" r="3" fill="#1F1B16"/>
      <circle cx="492" cy="153" r="3" fill="#1F1B16"/>
      {/* Smile */}
      <path d="M479,162 Q486,167 493,162" stroke="#1F1B16" strokeWidth="1.8" strokeLinecap="round" fill="none"/>

      {/* Speech bubble between them */}
      <path d="M437,140 C439,127 449,124 457,127 L457,142 C449,146 437,143 437,140Z" fill="white" stroke="#1F1B16" strokeWidth="1.5"/>
      <circle cx="443" cy="134" r="2.2" fill="#1F1B16" opacity="0.55"/>
      <circle cx="449" cy="134" r="2.2" fill="#1F1B16" opacity="0.55"/>
      <circle cx="455" cy="134" r="2.2" fill="#E85A2A" opacity="0.65"/>

    </svg>
  )
}
