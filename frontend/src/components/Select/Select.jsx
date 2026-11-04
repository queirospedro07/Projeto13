import './Select.css';
import { Children, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCheck as Check, LuChevronDown as ChevronDown } from 'react-icons/lu';

export const Seletor = ({
  value: valor,
  defaultValue: defaultValor,
  placeholder = 'Selecionar...',
  onChange: onAlterar,
  children: conteudoFilho,
  className: turmaNome = '',
  disabled = false,
  id,
  name: nome,
  title: titulo,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledPor,
  ...botaoPropriedades
}) => {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listboxId = useId();
  const [isAbrir, definirIsAbrir] = useState(false);
  const [ativoIndice, definirAtivoIndice] = useState(0);
  const [menuPosicao, definirMenuPosicao] = useState(null);
  const opcoes = Children.toArray(conteudoFilho)
    .filter((opcao) => isValidElement(opcao) && opcao.type === 'option')
    .map((opcao, indice) => ({
      value: opcao.props.value ?? String(indice),
      label: opcao.props.children,
      disabled: opcao.props.disabled,
    }));
  const selecionadoValor = valor ?? defaultValor ?? opcoes[0]?.value ?? '';
  const selecionadoIndice = opcoes.findIndex(
    (opcao) => String(opcao.value) === String(selecionadoValor),
  );
  const selecionadoOpcao = opcoes[selecionadoIndice];

  useEffect(() => {
    if (!isAbrir) return undefined;
    const atualizarPosicao = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const bounds = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const viewport = window.visualViewport;
      const largura = viewport?.width ?? window.innerWidth;
      const altura = viewport?.height ?? window.innerHeight;
      const topo = viewport?.offsetTop ?? 0;
      const esquerda = viewport?.offsetLeft ?? 0;
      const menuWidth = Math.min(Math.max(bounds.width, 200), largura - viewportPadding * 2);
      const left = Math.min(
        Math.max(esquerda + viewportPadding, bounds.left),
        esquerda + largura - menuWidth - viewportPadding,
      );
      const espacoBelow = topo + altura - bounds.bottom - viewportPadding;
      const espacoAbove = bounds.top - topo - viewportPadding;
      const placement = espacoBelow < 220 && espacoAbove > espacoBelow ? 'above' : 'below';
      const availableEspaco = placement === 'above' ? espacoAbove : espacoBelow;
      const maxHeight = Math.max(0, Math.min(280, availableEspaco - 8));

      definirMenuPosicao({
        '--menu-left': `${left}px`,
        '--menu-width': `${menuWidth}px`,
        '--menu-top': `${placement === 'above' ? Math.max(topo + viewportPadding, bounds.top - maxHeight - 8) : bounds.bottom + 8}px`,
        '--menu-max-height': `${maxHeight}px`,
      });
    };

    const tratarPonteiroDown = (evento) => {
      if (
        !triggerRef.current?.contains(evento.target) &&
        !menuRef.current?.contains(evento.target)
      ) {
        definirIsAbrir(false);
      }
    };

    atualizarPosicao();
    document.addEventListener('pointerdown', tratarPonteiroDown);
    window.addEventListener('resize', atualizarPosicao);
    window.visualViewport?.addEventListener('resize', atualizarPosicao);
    window.visualViewport?.addEventListener('scroll', atualizarPosicao);
    window.addEventListener('scroll', atualizarPosicao, true);

    return () => {
      document.removeEventListener('pointerdown', tratarPonteiroDown);
      window.removeEventListener('resize', atualizarPosicao);
      window.visualViewport?.removeEventListener('resize', atualizarPosicao);
      window.visualViewport?.removeEventListener('scroll', atualizarPosicao);
      window.removeEventListener('scroll', atualizarPosicao, true);
    };
  }, [isAbrir]);
  useEffect(() => {
    if (isAbrir) {
      menuRef.current?.children[ativoIndice]?.scrollIntoView?.({
        block: 'nearest',
      });
    }
  }, [ativoIndice, isAbrir]);

  const selecionarOpcao = (opcao) => {
    if (!opcao || opcao.disabled) return;
    onAlterar?.({
      target: {
        name: nome,
        value: String(opcao.value),
      },
    });
    definirIsAbrir(false);
    triggerRef.current?.focus();
  };

  const tratarChaveDown = (evento) => {
    if (evento.key === 'Escape' && isAbrir) {
      evento.preventDefault();
      evento.stopPropagation();
      definirIsAbrir(false);

      return;
    }

    if (evento.key === 'Tab' && isAbrir) definirIsAbrir(false);
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();

      const direction = evento.key === 'ArrowDown' ? 1 : -1;
      if (!isAbrir) {
        const startingIndice = selecionadoIndice >= 0 ? selecionadoIndice : 0;

        definirAtivoIndice(Math.max(0, startingIndice));
        definirIsAbrir(true);

        return;
      }

      if (opcoes.length)
        definirAtivoIndice((atual) => (atual + direction + opcoes.length) % opcoes.length);

      return;
    }

    if ((evento.key === 'Enter' || evento.key === ' ') && !isAbrir) {
      evento.preventDefault();
      definirAtivoIndice(Math.max(0, selecionadoIndice));
      definirIsAbrir(true);

      return;
    }

    if (evento.key === 'Home' && isAbrir) {
      evento.preventDefault();
      definirAtivoIndice(0);
    }

    if (evento.key === 'End' && isAbrir) {
      evento.preventDefault();
      definirAtivoIndice(Math.max(0, opcoes.length - 1));
    }

    if (evento.key === 'Enter' && isAbrir) {
      evento.preventDefault();

      const opcao = opcoes[ativoIndice];
      if (opcao) selecionarOpcao(opcao);
    }
  };

  return (
    <>
      <button
        {...botaoPropriedades}
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        name={nome}
        title={titulo}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledPor}
        aria-haspopup="listbox"
        aria-expanded={isAbrir}
        aria-controls={listboxId}
        aria-activedescendant={isAbrir && opcoes.length ? `${listboxId}-${ativoIndice}` : undefined}
        onKeyDown={tratarChaveDown}
        onClick={() => {
          if (disabled) return;
          definirAtivoIndice(Math.max(0, selecionadoIndice));
          definirIsAbrir((abrir) => !abrir);
        }}
        className={`custom-select-trigger ${turmaNome}`}
      >
        <span className="custom-select-label">
          {selecionadoOpcao?.label ?? (opcoes.length ? placeholder : 'Sem opções disponíveis')}
        </span>
        <ChevronDown
          className={`custom-select-chevron ${isAbrir ? 'is-open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isAbrir &&
        menuPosicao &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            className="custom-select-menu custom-scrollbar"
            style={menuPosicao}
          >
            {!opcoes.length && (
              <div
                className="custom-select-empty"
                role="option"
                aria-disabled="true"
                aria-selected="false"
              >
                Sem opções disponíveis
              </div>
            )}
            {opcoes.map((opcao, indice) => {
              const isSelecionado = indice === selecionadoIndice;
              const isAtivo = indice === ativoIndice;

              return (
                <button
                  key={`${opcao.value}-${indice}`}
                  id={`${listboxId}-${indice}`}
                  type="button"
                  role="option"
                  aria-selected={isSelecionado}
                  disabled={opcao.disabled}
                  className={`custom-select-option ${isAtivo ? 'is-active' : ''} ${isSelecionado ? 'is-selected' : ''}`}
                  onMouseEnter={() => definirAtivoIndice(indice)}
                  onClick={() => selecionarOpcao(opcao)}
                >
                  <span className="custom-select-option-label">{opcao.label}</span>
                  {isSelecionado && (
                    <Check
                      className="custom-select-option-check"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
};

export default Seletor;
