/**
 * Inline SVG icon set (no icon library dependency).
 * All icons share a 24x24 box, 1.75 stroke and `currentColor` so they inherit
 * the surrounding text colour and can be sized with the `size` prop.
 */

function Svg({ size = 18, children, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconGauge = (props) => (
  <Svg {...props}>
    <path d="M4 19h16" />
    <path d="M7 19v-4" />
    <path d="M12 19V9" />
    <path d="M17 19v-7" />
  </Svg>
);

export const IconLeads = (props) => (
  <Svg {...props}>
    <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
    <circle cx="10" cy="8" r="3.2" />
    <path d="M19 20v-1.2a3 3 0 0 0-2.2-2.9" />
    <path d="M15.4 5.2a3 3 0 0 1 0 5.6" />
  </Svg>
);

export const IconSettings = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a1.9 1.9 0 1 1-2.7 2.7l-.05-.06a1.6 1.6 0 0 0-1.78-.32 1.6 1.6 0 0 0-1 1.47V21a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a1.9 1.9 0 1 1-2.7-2.7l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-1H3a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a1.9 1.9 0 1 1 2.7-2.7l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 1-1.47V3a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.78-.32l.05-.06a1.9 1.9 0 1 1 2.7 2.7l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47 1H21a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.47 1z" />
  </Svg>
);

export const IconBell = (props) => (
  <Svg {...props}>
    <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    <path d="M13.7 20a2 2 0 0 1-3.4 0" />
  </Svg>
);

export const IconMenu = (props) => (
  <Svg {...props}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </Svg>
);

export const IconClose = (props) => (
  <Svg {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Svg>
);

export const IconSearch = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </Svg>
);

export const IconPlus = (props) => (
  <Svg {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Svg>
);

export const IconUsers = (props) => (
  <Svg {...props}>
    <path d="M17 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H6.4A3.4 3.4 0 0 0 3 18.4V20" />
    <circle cx="10" cy="7.5" r="3.4" />
    <path d="M21 20v-1.6a3.4 3.4 0 0 0-2.6-3.3" />
    <path d="M15.5 4.3a3.4 3.4 0 0 1 0 6.4" />
  </Svg>
);

export const IconSparkle = (props) => (
  <Svg {...props}>
    <path d="M12 3.5 13.7 8 18 9.5 13.7 11 12 15.5 10.3 11 6 9.5 10.3 8z" />
    <path d="M18.5 15.5 19.2 17.3 21 18l-1.8.7-.7 1.8-.7-1.8L16 18l1.8-.7z" />
  </Svg>
);

export const IconTarget = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.4" />
    <path d="M12 2v2.5" />
    <path d="M12 19.5V22" />
  </Svg>
);

export const IconTrophy = (props) => (
  <Svg {...props}>
    <path d="M8 21h8" />
    <path d="M12 17.5V21" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11" />
    <path d="M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11" />
  </Svg>
);

export const IconTrendUp = (props) => (
  <Svg {...props}>
    <path d="m3 16.5 5.5-5.5 3.5 3.5L21 5" />
    <path d="M15.5 5H21v5.5" />
  </Svg>
);

export const IconXCircle = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9 9 6 6" />
    <path d="m15 9-6 6" />
  </Svg>
);

export const IconMail = (props) => (
  <Svg {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.4" />
    <path d="m3.6 7 7.3 5.2a2 2 0 0 0 2.2 0L20.4 7" />
  </Svg>
);

export const IconPhone = (props) => (
  <Svg {...props}>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />
  </Svg>
);

export const IconBuilding = (props) => (
  <Svg {...props}>
    <rect x="4" y="3.5" width="16" height="17" rx="2.2" />
    <path d="M9 8h2" />
    <path d="M13 8h2" />
    <path d="M9 12h2" />
    <path d="M13 12h2" />
    <path d="M10 20.5v-4h4v4" />
  </Svg>
);

export const IconCalendar = (props) => (
  <Svg {...props}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.4" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </Svg>
);

export const IconNotes = (props) => (
  <Svg {...props}>
    <path d="M6 3.5h9.5L20 8v12a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 5 20V5a1.5 1.5 0 0 1 1-1.5z" />
    <path d="M14.5 3.7V8.3H19" />
    <path d="M8.5 13h7" />
    <path d="M8.5 16.5h4.5" />
  </Svg>
);

export const IconMore = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconEdit = (props) => (
  <Svg {...props}>
    <path d="M15.5 4.5 19.5 8.5" />
    <path d="M4.5 19.5 5 16l11-11 3.5 3.5L8.5 19.5z" />
  </Svg>
);

export const IconTrash = (props) => (
  <Svg {...props}>
    <path d="M4.5 7h15" />
    <path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7" />
    <path d="M6.5 7l.8 12.1A1.5 1.5 0 0 0 8.8 20.5h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    <path d="M10.5 11v5.5" />
    <path d="M13.5 11v5.5" />
  </Svg>
);

export const IconEye = (props) => (
  <Svg {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconArrowRight = (props) => (
  <Svg {...props}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Svg>
);

export const IconArrowLeft = (props) => (
  <Svg {...props}>
    <path d="M19 12H5" />
    <path d="m11 6-6 6 6 6" />
  </Svg>
);

export const IconExternal = (props) => (
  <Svg {...props}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10" />
  </Svg>
);

export const IconCheck = (props) => (
  <Svg {...props}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);

export const IconInfo = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <path d="M12 8.2h.01" />
  </Svg>
);

export const IconInbox = (props) => (
  <Svg {...props}>
    <path d="M3.5 13.5h4l1.2 2.4h6.6l1.2-2.4h4" />
    <path d="M5.6 5.2h12.8a2 2 0 0 1 1.9 1.4l1.2 5.5v5a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-5l1.2-5.5a2 2 0 0 1 1.9-1.4z" />
  </Svg>
);

export const IconGlobe = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5z" />
  </Svg>
);

export const IconClock = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Svg>
);

export const IconBriefcase = (props) => (
  <Svg {...props}>
    <rect x="3" y="7.5" width="18" height="12" rx="2.2" />
    <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
    <path d="M3 12.5h18" />
  </Svg>
);

export const IconUser = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </Svg>
);

export const IconFilter = (props) => (
  <Svg {...props}>
    <path d="M4 6h16" />
    <path d="M7 12h10" />
    <path d="M10 18h4" />
  </Svg>
);

export const IconLogout = (props) => (
  <Svg {...props}>
    <path d="M14 5.5H7.5A1.5 1.5 0 0 0 6 7v10a1.5 1.5 0 0 0 1.5 1.5H14" />
    <path d="M17.5 8.5 21 12l-3.5 3.5" />
    <path d="M21 12H10" />
  </Svg>
);

export const IconChart = (props) => (
  <Svg {...props}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="m7.5 15 3.5-4 3 2.5L20 7" />
  </Svg>
);
