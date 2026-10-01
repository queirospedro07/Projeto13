import React from 'react';
export const SkeletonCard = () => {
  return <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 animate-pulse flex flex-col gap-4">
      <div className="w-full h-44 bg-zinc-800/80 rounded-lg"></div>
      <div className="w-1/3 h-4 bg-zinc-800 rounded"></div>
      <div className="w-full h-6 bg-zinc-800 rounded"></div>
      <div className="w-3/4 h-4 bg-zinc-800 rounded"></div>
      <div className="flex justify-between items-center pt-2">
        <div className="w-16 h-5 bg-zinc-800 rounded"></div>
        <div className="w-20 h-8 bg-zinc-800 rounded-lg"></div>
      </div>
    </div>;
};
export const SkeletonLine = ({
  width = 'w-full',
  height = 'h-4',
  className = ''
}) => {
  return <div className={`${width} ${height} bg-zinc-800/80 rounded animate-pulse ${className}`} />;
};