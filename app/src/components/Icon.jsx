const PATHS = {
  home: <path d="M2.5 7.5L8 2.5l5.5 5M4 6.8V13h8V6.8M6.8 13V9.5h2.4V13" />,
  check: <path d="M3 8.5l3.2 3.2L13 4.8" />,
  x: <path d="M4 4l8 8M12 4l-8 8" />,
  play: <path d="M5 3v10l8-5z" />,
  chevron: <path d="M4 6l4 4 4-4" />,
  back: <path d="M10 3L5 8l5 5" />,
  plus: <path d="M8 3v10M3 8h10" />,
  trash: <path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.6 8h4.8l.6-8" />,
  refresh: <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5V5h-2.5" />,
  warning: <path d="M8 2.5l6 10.5H2zM8 7v3M8 11.5v.01" />,
  more: <path d="M3.5 8h.01M8 8h.01M12.5 8h.01" strokeWidth="2.4" />,
  sun: <path d="M8 5.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />,
  moon: <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z" />,
  auto: <><circle cx="8" cy="8" r="5.5" /><path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" /></>,
  format: <path d="M2.5 4h11M2.5 8h7M2.5 12h11M12.5 6.5l2 1.5-2 1.5" />,
  search: <path d="M7 2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM10.4 10.4L14 14" />,
  zoom: <path d="M7 2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM10.4 10.4L14 14M7 5v4M5 7h4" />,
  folder: <path d="M2 4.5h4l1.5 1.5H14v6.5H2z" />,
  move: <path d="M3 5h8M8.5 2.5L11 5 8.5 7.5M13 11H5M7.5 8.5L5 11l2.5 2.5" />,
  stats: <path d="M3 13V8M8 13V3M13 13V6" />,
  pencil: <path d="M3 13l.7-3L10.5 3.2l2.3 2.3L6 12.3z" />,
  sidebar: <path d="M2.5 3h11v10h-11zM6 3v10" />,
  task: <path d="M3.5 2.5h9v11h-9zM5.7 5.5h4.6M5.7 8h4.6M5.7 10.5h2.8" />,
  gear: <path d="M6.51 3.12L6.95 1.38L9.05 1.38L9.49 3.12L9.95 3.29L10.39 3.5L11.94 2.58L13.42 4.06L12.5 5.61L12.71 6.05L12.88 6.51L14.62 6.95L14.62 9.05L12.88 9.49L12.71 9.95L12.5 10.39L13.42 11.94L11.94 13.42L10.39 12.5L9.95 12.71L9.49 12.88L9.05 14.62L6.95 14.62L6.51 12.88L6.05 12.71L5.61 12.5L4.06 13.42L2.58 11.94L3.5 10.39L3.29 9.95L3.12 9.49L1.38 9.05L1.38 6.95L3.12 6.51L3.29 6.05L3.5 5.61L2.58 4.06L4.06 2.58L5.61 3.5L6.05 3.29zM8 5.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8z" />,
  flag: <path d="M3.5 14V2.5M3.5 3h8.5l-2 3 2 3H3.5" />,
  terminal: <path d="M3.5 4.5L7 8l-3.5 3.5M8.5 11.5h4" strokeWidth="2" />,
  expand: <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5L9 7M2.5 13.5L7 9" />,
  help: <><circle cx="8" cy="8" r="6" /><path d="M6.2 6.4a1.8 1.8 0 1 1 2.6 1.6c-.5.3-.8.7-.8 1.3M8 11.4v.01" /></>,
  exit: <path d="M6.5 2.5h-3v11h3M9.5 5.5L12.5 8l-3 2.5M12.5 8H6" />,
  questions: <path d="M6 4h8M6 8h8M6 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01" strokeWidth="2" />,
  code: <path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5" />,
};

export default function Icon({ name, solid, ...rest }) {
  return (
    <svg className={`icon${solid ? ' solid' : ''}`} viewBox="0 0 16 16" aria-hidden="true" {...rest}>
      {PATHS[name]}
    </svg>
  );
}
