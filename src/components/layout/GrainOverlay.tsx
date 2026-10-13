/** Subtle animated film grain over the whole page (CSS only, no JS). */
export function GrainOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div className="grain" />
    </div>
  );
}
