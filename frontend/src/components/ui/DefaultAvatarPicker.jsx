import React from 'react';
import { Check } from 'lucide-react';
import { DEFAULT_AVATARS } from '../../constants/defaultAvatars';

export const DefaultAvatarPicker = ({ value, onChange, label = 'Escolha um avatar' }) => (
  <fieldset className="min-w-0">
    <legend className="mb-2 text-xs font-semibold text-slate-700 dark:text-neutral-300">{label}</legend>
    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-4">
      {DEFAULT_AVATARS.map(avatar => {
        const selected = value === avatar.url;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onChange(avatar.url)}
            aria-label={`Escolher avatar ${avatar.label}`}
            aria-pressed={selected}
            className={`group relative aspect-square overflow-hidden rounded-2xl border-2 bg-slate-100 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:bg-neutral-800 ${selected ? 'border-violet-500 ring-2 ring-violet-500/20 scale-[1.02] shadow-lg shadow-violet-500/10 dark:border-violet-400' : 'border-slate-200 hover:border-violet-400 hover:shadow-md hover:shadow-violet-500/10 dark:border-neutral-700 dark:hover:border-violet-500'}`}
          >
            <img src={avatar.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-white/10" />
            {selected && (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm ring-2 ring-white dark:ring-neutral-900">
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