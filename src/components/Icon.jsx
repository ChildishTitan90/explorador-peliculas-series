const paths = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  play: <path d="m8 4 12 8-12 8Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4 4L20 5" />,
  share: <path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7" />,
  left: <path d="m14 5-7 7 7 7" />,
  right: <path d="m9 5 7 7-7 7" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  home: <path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z" />,
  explore: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16 8-2 6-6 2 2-6Z" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 3v18M17 3v18M3 8h4m10 0h4M3 16h4m10 0h4" />
    </>
  ),
  tv: (
    <>
      <rect x="2" y="6" width="20" height="15" rx="3" />
      <path d="m8 2 4 4 4-4" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="13" rx="2" />
      <path d="M16 8V3H3v13h5" />
    </>
  ),
};
export default function Icon({ name, filled = false }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.film}
    </svg>
  );
}
