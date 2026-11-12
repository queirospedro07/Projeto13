import './Skeleton.css';

export function Esqueleto({ className = '', shape = 'line' }) {
  return <span aria-hidden="true" className={`skeleton skeleton--${shape} ${className}`} />;
}

export function EsqueletoCartoes({
  count = 3,
  className = '',
  label = 'A carregar itens',
  announce = true,
}) {
  return (
    <div
      className={`skeleton-cards ${className}`}
      {...(announce
        ? { role: 'status', 'aria-label': label, 'aria-busy': 'true' }
        : { 'aria-hidden': 'true' })}
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index} aria-hidden="true">
          <Esqueleto shape="image" />
          <Esqueleto className="skeleton-card__title" />
          <Esqueleto className="skeleton-card__line" />
          <Esqueleto className="skeleton-card__short" />
        </div>
      ))}
    </div>
  );
}

export function EsqueletoLinhas({
  count = 4,
  className = '',
  withAvatar = false,
  label = 'A carregar lista',
}) {
  return (
    <div
      className={`skeleton-rows ${className}`}
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-row" key={index} aria-hidden="true">
          {withAvatar && <Esqueleto shape="circle" className="skeleton-row__avatar" />}
          <div className="skeleton-row__content">
            <Esqueleto className="skeleton-row__primary" />
            <Esqueleto className="skeleton-row__secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EsqueletoPagina({ variant = 'default', label = 'A carregar conteúdo' }) {
  return (
    <section
      className={`skeleton-page skeleton-page--${variant}`}
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      <div className="skeleton-page__header" aria-hidden="true">
        <Esqueleto className="skeleton-page__title" />
        <Esqueleto className="skeleton-page__subtitle" />
      </div>
      {variant === 'player' ? (
        <div className="skeleton-player" aria-hidden="true">
          <div className="skeleton-player__main">
            <Esqueleto shape="image" className="skeleton-player__video" />
            <Esqueleto className="skeleton-page__title" />
            <Esqueleto className="skeleton-page__subtitle" />
          </div>
          <div className="skeleton-player__sidebar">
            {Array.from({ length: 5 }, (_, index) => (
              <Esqueleto key={index} className="skeleton-player__row" />
            ))}
          </div>
        </div>
      ) : variant === 'profile' ? (
        <div className="skeleton-profile" aria-hidden="true">
          <Esqueleto shape="image" className="skeleton-profile__cover" />
          <div className="skeleton-profile__identity">
            <Esqueleto shape="circle" className="skeleton-profile__avatar" />
            <div className="skeleton-profile__details">
              <Esqueleto className="skeleton-profile__name" />
              <Esqueleto className="skeleton-page__subtitle" />
            </div>
          </div>
          <EsqueletoCartoes count={3} announce={false} />
        </div>
      ) : variant === 'course' ? (
        <div className="skeleton-course" aria-hidden="true">
          <Esqueleto shape="image" className="skeleton-course__hero" />
          <div className="skeleton-course__details">
            <Esqueleto className="skeleton-page__title" />
            <Esqueleto className="skeleton-page__subtitle" />
            <Esqueleto className="skeleton-course__line" />
            <Esqueleto className="skeleton-course__line" />
          </div>
          <EsqueletoCartoes count={3} announce={false} />
        </div>
      ) : (
        <EsqueletoCartoes count={variant === 'catalog' ? 6 : 3} announce={false} />
      )}
    </section>
  );
}
