/**
 * Adorno de dos círculos y tres líneas del diseño original. En la cabecera va en
 * horizontal; con la clase header-deco--vertical cuelga bajo el retrato.
 */
export function HeaderDeco({ className = '' }: { className?: string }) {
  return (
    <div className={`header-deco ${className}`.trim()} aria-hidden="true">
      <span className="header-deco__out">
        <span className="header-deco__in" />
      </span>
      <span className="header-deco__line header-deco__line--1" />
      <span className="header-deco__line header-deco__line--2" />
      <span className="header-deco__line header-deco__line--3" />
    </div>
  )
}
