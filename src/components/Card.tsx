import type { ReactNode } from "react";

interface CardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onClick?: () => void;
  /** Extra content the parent wants injected below the title/subtitle. */
  children?: ReactNode;
}

const FALLBACK_IMAGE = "https://placehold.co/256x256/E2E8F0/475569?text=Pokémon";

export function Card({ title, subtitle, imageUrl, onClick, children }: CardProps) {
  const isInteractive = typeof onClick === "function";

  return (
    <div
      className="card"
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.();
            }
          : undefined
      }
    >
      {imageUrl && (
        <img
          className="card__image"
          src={imageUrl}
          alt={title}
          loading="lazy"
          onError={(event) => {
            const target = event.currentTarget;
            if (!target.dataset.fallbackApplied) {
              target.dataset.fallbackApplied = "true";
              target.src = FALLBACK_IMAGE;
            }
          }}
        />
      )}
      <div className="card__body">
        <h3 className="card__title">{title}</h3>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
