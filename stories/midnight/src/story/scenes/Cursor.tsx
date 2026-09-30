/* A pointer that acts out the clicks, plus the ring it leaves behind. Its hotspot is the
 * arrow's tip at (3, 2), so the story positions it at target − (3, 2). */

export function Cursor() {
  return (
    <>
      <span className="cursor-ring" aria-hidden />
      <svg className="cursor" width="24" height="28" viewBox="0 0 24 28" aria-hidden>
        <path
          d="M3 2 L3 21.5 L8.2 16.9 L11.9 25 L15.3 23.5 L11.7 15.6 L18.6 15.6 Z"
          fill="#fafafa"
          stroke="#0a0a0a"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}
