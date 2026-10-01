import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Move, Check, RotateCcw, X, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Reusable Draggable Image Repositioning & Framing component
 * Allows the user to drag the image within its bounds or use a fine-grained slider
 * to adjust visible crop (objectPosition / backgroundPosition).
 * 
 * Props:
 * - imageUrl: string
 * - position: string (e.g. "50% 50%")
 * - onPositionChange: (newPosition: string) => void
 * - isEditing: boolean (whether reposition drag mode is active)
 * - onSave: () => void
 * - onCancel: () => void
 * - className: string (container styles)
 * - overlayChildren: React.ReactNode (elements to show when not editing)
 * - alt: string
 */
export const DraggableImageCrop = ({
  imageUrl,
  position = '50% 50%',
  onPositionChange,
  isEditing = false,
  onSave,
  onCancel,
  className = 'h-48 sm:h-56 w-full',
  overlayChildren,
  alt = 'Imagem'
}) => {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialPosX: 50, initialPosY: 50 });

  // Parse current position
  const parsePos = useCallback((posStr) => {
    if (!posStr || typeof posStr !== 'string') return { x: 50, y: 50 };
    const parts = posStr.trim().split(/\s+/);
    const x = parseFloat(parts[0]) ?? 50;
    const y = parseFloat(parts[1]) ?? 50;
    return {
      x: isNaN(x) ? 50 : Math.max(0, Math.min(100, x)),
      y: isNaN(y) ? 50 : Math.max(0, Math.min(100, y))
    };
  }, []);

  const { x: posX, y: posY } = parsePos(position);

  // Direct pointer down to start dragging
  const handlePointerDown = (e) => {
    if (!isEditing || !imageUrl) return;
    // Don't drag if clicking buttons or interactive controls
    if (e.target.closest('button') || e.target.closest('input')) return;

    e.preventDefault();
    setIsDragging(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: posX,
      initialPosY: posY
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Movement delta relative to element dimensions
    const deltaX = ((e.clientX - dragStartRef.current.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartRef.current.startY) / rect.height) * 100;

    // Invert delta: moving pointer down pulls image down, revealing top (lower % for object-position)
    const newX = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initialPosX - deltaX)));
    const newY = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initialPosY - deltaY)));

    onPositionChange?.(`${newX}% ${newY}%`);
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const updateY = (newY) => {
    const clampedY = Math.max(0, Math.min(100, Math.round(newY)));
    onPositionChange?.(`${posX}% ${clampedY}%`);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative overflow-hidden select-none touch-none ${className} ${
        isEditing
          ? isDragging
            ? 'cursor-grabbing ring-2 ring-blue-500 shadow-inner'
            : 'cursor-grab ring-2 ring-blue-400'
          : ''
      }`}
    >
      {/* Target Image with precise CSS objectPosition */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={alt}
          draggable={false}
          className="w-full h-full object-cover pointer-events-none transition-all duration-75"
          style={{ objectPosition: `${posX}% ${posY}%` }}
        />
      )}

      {/* Editing Overlay Guide & Controls */}
      {isEditing && (
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-3 z-20 pointer-events-none animate-fade-in">
          {/* Top Instruction Pill */}
          <div className="flex items-center justify-between gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
              <Move className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Arraste a imagem ou use o seletor ({posY}%)</span>
            </div>

            {/* Quick Position Presets */}
            <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/20 p-1 rounded-xl shadow-lg">
              <button
                type="button"
                onClick={() => updateY(0)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  posY <= 10 ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
                title="Enquadrar no Topo"
              >
                Topo
              </button>
              <button
                type="button"
                onClick={() => updateY(50)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  posY > 40 && posY < 60 ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
                title="Centrar"
              >
                Centro
              </button>
              <button
                type="button"
                onClick={() => updateY(100)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  posY >= 90 ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
                title="Enquadrar no Fundo"
              >
                Fundo
              </button>
            </div>
          </div>

          {/* Bottom Controls Bar: Vertical Slider + Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pointer-events-auto bg-black/85 backdrop-blur-md border border-white/20 p-2.5 rounded-2xl shadow-xl">
            {/* Fine-Tuning Slider */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-sm px-1">
              <SlidersHorizontal className="w-4 h-4 text-blue-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={posY}
                onChange={(e) => updateY(Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
              <span className="text-xs font-mono font-bold text-white min-w-[36px] text-right">
                {posY}%
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onPositionChange?.('50% 50%')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="Centrar posição padrão"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer border border-blue-400"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Posição</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Children overlays (badges, action buttons, etc.) */}
      {!isEditing && overlayChildren}
    </div>
  );
};

export default DraggableImageCrop;
