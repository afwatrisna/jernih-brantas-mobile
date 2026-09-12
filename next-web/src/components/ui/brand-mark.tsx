/** Official Jernih water-drop mark. Uses currentColor for the drop body. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-mark-svg ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M32 3C32 3 9 30 9 48.5C9 61.755 19.745 72.5 33 72.5S57 61.755 57 48.5C57 30 32 3 32 3ZM39.2 28.2c5.8 1.4 7.6 7.8 4.2 16.6-3.5 9.1-11.2 15.8-20.4 17.8 1.5-11.5 7.4-24.2 16.2-34.4Z"
      />
    </svg>
  );
}
