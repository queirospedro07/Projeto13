import './Select.css';
import { Children, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCheck as Check, LuChevronDown as ChevronDown } from 'react-icons/lu';

export const Select = ({
  value,
  defaultValue,
  placeholder = 'Selecionar...',
  onChange,
  children,
  className = '',
  disabled = false,
  id,
  name,
  title,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...buttonProps
}) => {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState(null);
  const options = Children.toArray(children)
    .filter((option) => isValidElement(option) && option.type === 'option')
    .map((option, index) => ({
      value: option.props.value ?? String(index),
      label: option.props.children,
      disabled: option.props.disabled,
    }));
  const selectedValue = value ?? defaultValue ?? options[0]?.value ?? '';
  const selectedIndex = options.findIndex(
    (option) => String(option.value) === String(selectedValue),
  );
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!isOpen) return undefined;
    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const bounds = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const menuWidth = Math.min(
        Math.max(bounds.width, 200),
        window.innerWidth - viewportPadding * 2,
      );
      const left = Math.min(
        Math.max(viewportPadding, bounds.left),
        window.innerWidth - menuWidth - viewportPadding,
      );
      const spaceBelow = window.innerHeight - bounds.bottom - viewportPadding;
      const spaceAbove = bounds.top - viewportPadding;
      const placement = spaceBelow < 220 && spaceAbove > spaceBelow ? 'above' : 'below';
      const availableSpace = placement === 'above' ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(120, Math.min(280, availableSpace - 8));

      setMenuPosition({
        '--menu-left': `${left}px`,
        '--menu-width': `${menuWidth}px`,
        '--menu-top': `${placement === 'above' ? Math.max(viewportPadding, bounds.top - maxHeight - 8) : bounds.bottom + 8}px`,
        '--menu-max-height': `${maxHeight}px`,
      });
    };

    const handlePointerDown = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    updatePosition();
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);
  useEffect(() => {
    if (isOpen) {
      menuRef.current?.children[activeIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [activeIndex, isOpen]);

  const selectOption = (option) => {
    if (option.disabled) return;
    onChange?.({
      target: {
        name,
        value: String(option.value),
      },
    });
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);

      return;
    }

    if (event.key === 'Tab' && isOpen) setIsOpen(false);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      const direction = event.key === 'ArrowDown' ? 1 : -1;
      if (!isOpen) {
        const startingIndex = selectedIndex >= 0 ? selectedIndex : 0;

        setActiveIndex(Math.max(0, startingIndex));
        setIsOpen(true);

        return;
      }

      setActiveIndex((current) => (current + direction + options.length) % options.length);

      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && !isOpen) {
      event.preventDefault();
      setActiveIndex(Math.max(0, selectedIndex));
      setIsOpen(true);

      return;
    }

    if (event.key === 'Home' && isOpen) {
      event.preventDefault();
      setActiveIndex(0);
    }

    if (event.key === 'End' && isOpen) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    }

    if (event.key === 'Enter' && isOpen) {
      event.preventDefault();

      const option = options[activeIndex];
      if (option) selectOption(option);
    }
  };

  return (
    <>
      <button
        {...buttonProps}
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        name={name}
        title={title}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen ? `${listboxId}-${activeIndex}` : undefined}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (disabled) return;
          setActiveIndex(Math.max(0, selectedIndex));
          setIsOpen((open) => !open);
        }}
        className={`custom-select-trigger ${className}`}
      >
        <span className="custom-select-label">{selectedOption?.label ?? placeholder}</span>
        <ChevronDown
          className={`custom-select-chevron ${isOpen ? 'is-open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            className="custom-select-menu custom-scrollbar"
            style={menuPosition}
          >
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;
              const isActive = index === activeIndex;

              return (
                <button
                  key={`${option.value}-${index}`}
                  id={`${listboxId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  className={`custom-select-option ${isActive ? 'is-active' : ''} ${isSelected ? 'is-selected' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  <span className="custom-select-option-label">{option.label}</span>
                  {isSelected && (
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

export default Select;
