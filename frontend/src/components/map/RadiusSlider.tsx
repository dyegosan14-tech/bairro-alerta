import React from 'react';
import { Compass } from 'lucide-react';

interface RadiusSliderProps {
  radiusKm: number;
  onChange: (val: number) => void;
}

export const RadiusSlider: React.FC<RadiusSliderProps> = ({ radiusKm, onChange }) => {
  const presets = [1, 3, 5, 10, 20];

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
          <Compass className="w-4 h-4 text-brand-600" />
          <span>Raio de busca:</span>
        </div>
        <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
          {radiusKm} km
        </span>
      </div>

      <input
        type="range"
        min={1}
        max={25}
        step={1}
        value={radiusKm}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
      />

      <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
        {presets.map((val) => (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={`px-1.5 py-0.5 rounded transition-all ${
              radiusKm === val
                ? 'bg-brand-600 text-white font-bold'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {val}km
          </button>
        ))}
      </div>
    </div>
  );
};
