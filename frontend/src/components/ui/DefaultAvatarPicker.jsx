import React from 'react';
import { Check } from 'lucide-react';
import { DEFAULT_AVATARS } from '../../constants/defaultAvatars';

export const DefaultAvatarPicker = ({ value, onChange, label = 'Escolha um avatar' }) => (
  <fieldset className="min-w-0">
    <legend className="mb-2 text-xs font-semibold text-slate-700 dark:text-neutral-300">{label}</legend>
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {DEFAULT_AVATARS.map(avatar => {
        const selected = value === avatar.url;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onChange(avatar.url)}
            aria-label={`Escolher avatar ${avatar.label}`}
            aria-pressed={selected}
            className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-neutral-800 ${selected ? 'border-blue-600 ring-2 ring-blue-600/20 dark:border-blue-400' : 'border-slate-200 hover:border-blue-400 dark:border-neutral-700 dark:hover:border-blue-500'}`}
          >
            <img src={avatar.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            {selected && (
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                <Check className="h-3 w-3" />
              </span>
            )}
            <span className="sr-only">{avatar.label}</span>
          </button>
        );
      })}
    </div>
  </fieldset>
);