// Shared SVG noise filter for the paper texture. Rendered once, referenced by url(#paper-grain).
export default function PaperFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.03 0" />
      </filter>
      <filter id="paper-grain-strong">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="3" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0" />
      </filter>
    </svg>
  )
}
