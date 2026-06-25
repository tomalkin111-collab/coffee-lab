export function Icon({ name, size = 20 }) {
  const paths = {
    home: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v10h13V10M9 20v-6h6v6" />
      </>
    ),
    beans: (
      <>
        <path d="M17.7 6.3c3.2 3.2 2.8 8.7-.8 12.3s-9.1 4-12.3.8-2.8-8.7.8-12.3 9.1-4 12.3-.8Z" />
        <path d="M17.7 6.3c-3.2.6-4.6 2.4-5.5 4.3-.9 2-1.4 4.4-4.8 5.9" />
      </>
    ),
    shot: (
      <>
        <path d="M5 4h12v7a6 6 0 0 1-12 0V4Z" />
        <path d="M17 6h1a3 3 0 0 1 0 6h-1M4 21h15" />
      </>
    ),
    setup: (
      <>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    back: <path d="m15 18-6-6 6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    thermometer: (
      <>
        <path d="M9 14.8V5a3 3 0 0 1 6 0v9.8a5 5 0 1 1-6 0Z" />
        <path d="M12 8v9" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    edit: (
      <>
        <path d="m14 5 5 5L9 20H4v-5L14 5Z" />
        <path d="m12 7 5 5" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3Z" />
        <path d="m19 15 .6 2.1L22 18l-2.4.9L19 21l-.6-2.1L16 18l2.4-.9L19 15Z" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
