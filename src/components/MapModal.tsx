import React from 'react';
import { PlayerPosition, Mission, Vehicle } from '../types';
import { BUILDINGS, ROADS, ZONES, RESTRICTED_HUSTLE_ZONES, WORLD_WIDTH, WORLD_HEIGHT } from '../data/zones';
import { X, Navigation, Home, Shield, Utensils, ShoppingBag, Car, Compass } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  playerPos: PlayerPosition;
  activeMission: Mission | null;
  vehicles: Vehicle[];
  kanjoPos?: { x: number; y: number; state: string } | null;
  onClose: () => void;
}

export const MapModal: React.FC<Props> = ({ playerPos, activeMission, vehicles, kanjoPos, onClose }) => {
  // Map dimensions for the modal
  const mapSvgWidth = 720;
  const mapSvgHeight = 360;

  const scaleX = mapSvgWidth / WORLD_WIDTH;
  const scaleY = mapSvgHeight / WORLD_HEIGHT;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-sans">
      <div className="w-full max-w-4xl bg-zinc-950 border-2 border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-zinc-900 px-6 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-sky-400" />
            <h3 className="font-extrabold text-white text-base tracking-wide">
              KANAIRO GPS SATELLITE MAP
            </h3>
          </div>
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Stylized Vector SVG Map */}
        <div className="p-4 bg-zinc-950 flex justify-center overflow-x-auto">
          <div className="relative border-2 border-zinc-800 rounded-2xl overflow-hidden shadow-inner bg-zinc-900">
            <svg
              width={mapSvgWidth}
              height={mapSvgHeight}
              viewBox={`0 0 ${mapSvgWidth} ${mapSvgHeight}`}
              className="block"
            >
              {/* Zones Background */}
              {/* Kayole */}
              <rect x={0} y={0} width={1800 * scaleX} height={mapSvgHeight} fill="#271c19" />
              {/* Highway */}
              <rect x={1800 * scaleX} y={0} width={1400 * scaleX} height={mapSvgHeight} fill="#142814" />
              {/* CBD */}
              <rect x={3200 * scaleX} y={0} width={(WORLD_WIDTH - 3200) * scaleX} height={mapSvgHeight} fill="#182026" />

              {/* Zone Labels */}
              <text x={800 * scaleX} y={40} fill="#f59e0b" fontSize="13" fontWeight="bold" textAnchor="middle">
                KAYOLE (MTAA)
              </text>
              <text x={2500 * scaleX} y={40} fill="#22c55e" fontSize="13" fontWeight="bold" textAnchor="middle">
                JOGOO ROAD HIGHWAY
              </text>
              <text x={4200 * scaleX} y={40} fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">
                NAIROBI CBD
              </text>

              {/* Roads */}
              {ROADS.map((r, i) => (
                <rect
                  key={i}
                  x={r.x * scaleX}
                  y={r.y * scaleY}
                  width={r.width * scaleX}
                  height={r.height * scaleY}
                  fill={r.isHighway ? '#334155' : '#3f3f46'}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
              ))}

              {/* Buildings */}
              {BUILDINGS.map((b) => (
                <g key={b.id}>
                  <rect
                    x={b.x * scaleX}
                    y={b.y * scaleY}
                    width={b.width * scaleX}
                    height={b.height * scaleY}
                    fill={b.color}
                    stroke="#0f172a"
                    strokeWidth="1"
                    rx={2}
                  />
                  <circle
                    cx={b.doorX * scaleX}
                    cy={b.doorY * scaleY}
                    r={3}
                    fill="#f59e0b"
                  />
                </g>
              ))}

              {/* Restricted Hustle Zones under Kanjo Enforcement */}
              {RESTRICTED_HUSTLE_ZONES.map((rz) => (
                <g key={rz.id}>
                  <rect
                    x={rz.x * scaleX}
                    y={rz.y * scaleY}
                    width={rz.width * scaleX}
                    height={rz.height * scaleY}
                    fill="rgba(234, 179, 8, 0.12)"
                    stroke="#eab308"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    rx={3}
                  />
                  <text
                    x={(rz.x + rz.width / 2) * scaleX}
                    y={(rz.y + 14) * scaleY}
                    fill="#fbbf24"
                    fontSize="7.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ⚠️ {rz.shengName}
                  </text>
                </g>
              ))}

              {/* Vehicles */}
              {vehicles.map((v) => (
                <circle
                  key={v.id}
                  cx={v.x * scaleX}
                  cy={v.y * scaleY}
                  r={v.type === 'MATATU' ? 5 : 3.5}
                  fill={v.type === 'MATATU' ? '#fbbf24' : v.type === 'POLICE_CAR' ? '#3b82f6' : '#ef4444'}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              ))}

              {/* Active Mission Target Marker */}
              {activeMission && activeMission.targetLocation && (
                <g className="animate-bounce">
                  <circle
                    cx={activeMission.targetLocation.x * scaleX}
                    cy={activeMission.targetLocation.y * scaleY}
                    r={8}
                    fill="#f59e0b"
                    fillOpacity="0.4"
                  />
                  <circle
                    cx={activeMission.targetLocation.x * scaleX}
                    cy={activeMission.targetLocation.y * scaleY}
                    r={4}
                    fill="#f59e0b"
                  />
                  <text
                    x={activeMission.targetLocation.x * scaleX}
                    y={activeMission.targetLocation.y * scaleY - 10}
                    fill="#f59e0b"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    MISSION
                  </text>
                </g>
              )}

              {/* Wandering Kanjo Officer Patrol Marker */}
              {kanjoPos && (
                <g>
                  <circle
                    cx={kanjoPos.x * scaleX}
                    cy={kanjoPos.y * scaleY}
                    r={6}
                    fill={kanjoPos.state === 'PURSUIT' ? '#ef4444' : '#eab308'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={kanjoPos.x * scaleX}
                    cy={kanjoPos.y * scaleY}
                    r={3}
                    fill="#000000"
                  />
                  <text
                    x={kanjoPos.x * scaleX}
                    y={kanjoPos.y * scaleY - 9}
                    fill={kanjoPos.state === 'PURSUIT' ? '#ef4444' : '#fbbf24'}
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {kanjoPos.state === 'PURSUIT' ? '🚨 KANJO' : 'KANJO'}
                  </text>
                </g>
              )}

              {/* Player Position Indicator */}
              <circle
                cx={playerPos.x * scaleX}
                cy={playerPos.y * scaleY}
                r={6}
                fill="#22c55e"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x={playerPos.x * scaleX}
                y={playerPos.y * scaleY - 9}
                fill="#22c55e"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                YOU
              </text>
            </svg>
          </div>
        </div>

        {/* Map Legend */}
        <div className="bg-zinc-900/90 px-6 py-3 border-t border-zinc-800 flex flex-wrap items-center justify-around gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
            <span>PLAYER</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>MISSION OBJECTIVE</span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-500">
            <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white" />
            <span>KANJO OFFICER</span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-300">
            <div className="w-3 h-3 rounded bg-amber-700" />
            <span>BEDSITTER (HOME)</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-400">
            <div className="w-3 h-3 rounded bg-green-700" />
            <span>KIBANDASKI FOOD</span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-400">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span>MATATU / VEHICLE</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-400">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>POLISI POST</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <div className="w-4 h-2.5 rounded-xs border border-amber-400 bg-amber-500/20" />
            <span>KANJO ZONE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
