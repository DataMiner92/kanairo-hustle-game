import React, { useState } from 'react';
import {
  MousePointerClick,
  Compass,
  RotateCcw,
  ZoomIn,
  Megaphone,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  HelpCircle,
} from 'lucide-react';

interface Props {
  hasActiveWaypoint: boolean;
  onClearWaypoint: () => void;
  onResetCamera: () => void;
  onOpenCheatsheet: () => void;
  isInVehicle: boolean;
}

export const MouseControlsHUD: React.FC<Props> = ({
  hasActiveWaypoint,
  onClearWaypoint,
  onResetCamera,
  onOpenCheatsheet,
  isInVehicle,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="absolute top-20 right-4 z-20 pointer-events-auto select-none font-sans">
      <div className="bg-neutral-950/90 border border-neutral-800 hover:border-cyan-500/60 transition-colors rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-white w-72">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-900/60 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <MousePointerClick className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wide flex items-center gap-1.5">
                <span>Mouse Controls</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse mouse controls' : 'Expand mouse controls'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isExpanded && (
          <div className="p-3 space-y-2.5 text-xs">
            {/* Quick Action Badges */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-neutral-300 bg-neutral-900/40 px-2 py-1.5 rounded-xl border border-neutral-800/60">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="font-mono text-[10px] bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/60 font-semibold">
                    L-CLICK
                  </span>
                  <span>Move & Interact</span>
                </span>
                <span className="text-[10px] text-neutral-400">Ground / NPCs / Cars</span>
              </div>

              <div className="flex items-center justify-between text-neutral-300 bg-neutral-900/40 px-2 py-1.5 rounded-xl border border-neutral-800/60">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="font-mono text-[10px] bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/60 font-semibold">
                    2x CLICK
                  </span>
                  <span>Sprint Dash</span>
                </span>
                <span className="text-[10px] text-neutral-400">Fast run</span>
              </div>

              <div className="flex items-center justify-between text-neutral-300 bg-neutral-900/40 px-2 py-1.5 rounded-xl border border-neutral-800/60">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="font-mono text-[10px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/60 font-semibold">
                    R-CLICK
                  </span>
                  <span>{isInVehicle ? 'Matatu Horn' : 'Sheng Shout'}</span>
                </span>
                <span className="text-[10px] text-neutral-400">Contextual</span>
              </div>

              <div className="flex items-center justify-between text-neutral-300 bg-neutral-900/40 px-2 py-1.5 rounded-xl border border-neutral-800/60">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="font-mono text-[10px] bg-violet-950/80 text-violet-300 px-1.5 py-0.5 rounded border border-violet-800/60 font-semibold">
                    DRAG
                  </span>
                  <span>360° Cam Orbit</span>
                </span>
                <span className="text-[10px] text-neutral-400">Free view</span>
              </div>

              <div className="flex items-center justify-between text-neutral-300 bg-neutral-900/40 px-2 py-1.5 rounded-xl border border-neutral-800/60">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="font-mono text-[10px] bg-sky-950/80 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800/60 font-semibold">
                    SCROLL
                  </span>
                  <span>Dynamic Zoom</span>
                </span>
                <span className="text-[10px] text-neutral-400">In / Out</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-1 flex items-center gap-1.5 border-t border-neutral-800/80">
              <button
                onClick={onResetCamera}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-200 hover:text-white rounded-xl text-[11px] font-semibold transition-all cursor-pointer border border-neutral-700/60"
                title="Reset 3D camera angle and zoom back to default"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" />
                <span>Reset View</span>
              </button>

              {hasActiveWaypoint && (
                <button
                  onClick={onClearWaypoint}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900/80 text-rose-200 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border border-rose-800/60 animate-pulse"
                  title="Cancel active movement waypoint"
                >
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>Stop</span>
                </button>
              )}

              <button
                onClick={onOpenCheatsheet}
                className="p-1.5 bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 hover:text-white rounded-xl transition-all cursor-pointer border border-neutral-700/60"
                title="Open Controls Cheatsheet [TAB]"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
