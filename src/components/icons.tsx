import type { ReactNode } from "react";

type IconProps = { name: string; className?: string };

const paths: Record<string, ReactNode> = {
  cart: (
    <path d="M6 6h15l-1.5 9h-12z M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM6 6 5 3H2" />
  ),
  search: <path d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm5-2 4 4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: <path d="M4 7h16M9 7V4h6v3M8 7l1 13h6l1-13" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  check: <path d="M5 12l5 5L20 7" />,
  print: <path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5h18v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z" />,
  logout: <path d="M10 7V4H4v16h6v-3M10 12h10M16 8l4 4-4 4" />,
  box: <path d="M3 8l9-5 9 5-9 5-9-5zm0 0v8l9 5 9-5V8" />,
  chart: <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />,
  settings: <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM4 12h2M18 12h2M12 4v2M12 18v2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4" />,
  tag: <path d="M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v6l4 2" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0" />,
  alert: <path d="M12 9v4M12 17h.01M10.3 4.8 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0z" />,
  store: <path d="M4 10h16M6 10V20h12V10M3 10l2-6h14l2 6M9 20v-5h6v5" />,
};

export function Icon({ name, className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  );
}
