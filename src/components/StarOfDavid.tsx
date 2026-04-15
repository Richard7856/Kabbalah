// Decorative Star of David SVG — used in header and loading state
export default function StarOfDavid({ size = 40 }: { size?: number }) {
  // Two overlapping equilateral triangles form the Magen David
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Upward triangle */}
      <polygon
        points="50,8 92,78 8,78"
        fill="none"
        stroke="#c9a84c"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* Downward triangle */}
      <polygon
        points="50,92 8,22 92,22"
        fill="none"
        stroke="#c9a84c"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
