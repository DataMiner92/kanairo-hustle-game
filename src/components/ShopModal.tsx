import React from 'react';
import { ShopItem, PlayerStats } from '../types';
import { SHOP_ITEMS } from '../data/items';
import { X, Utensils, ShoppingBag, Zap, Heart, Check } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  shopTitle: string;
  shopType: 'KIBANDASKI' | 'ELECTRONICS';
  playerStats: PlayerStats;
  onBuyItem: (item: ShopItem) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<Props> = ({ shopTitle, shopType, playerStats, onBuyItem, onClose }) => {
  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (shopType === 'KIBANDASKI') return item.category === 'FOOD';
    return item.category === 'GOODS' || item.category === 'UPGRADE';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none font-sans">
      <div className="w-full max-w-xl bg-zinc-950 border-2 border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg">
              {shopType === 'KIBANDASKI' ? <Utensils className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">{shopTitle}</h3>
              <p className="text-[11px] text-zinc-400">
                {shopType === 'KIBANDASKI'
                  ? 'Hot fresh food to restore hunger & stamina'
                  : 'Trade goods, electronics & hustle gear'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-zinc-800 px-3 py-1 rounded-full text-xs font-mono font-bold text-emerald-400">
              Ksh {playerStats.money.toLocaleString()}
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
        </div>

        {/* Items Grid */}
        <div className="p-5 max-h-96 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-900/40">
          {filteredItems.map((item) => {
            const canAfford = playerStats.money >= item.price;

            return (
              <div
                key={item.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      <h4 className="font-bold text-sm text-zinc-100">{item.name}</h4>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{item.description}</p>
                </div>

                {/* Restoration stats badges if food */}
                {item.category === 'FOOD' && (
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    {item.hungerRestore && (
                      <span className="text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded">
                        +{item.hungerRestore}% Hunger
                      </span>
                    )}
                    {item.energyRestore && (
                      <span className="text-yellow-400 bg-yellow-950/80 px-2 py-0.5 rounded">
                        +{item.energyRestore}% Energy
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                  <span className="font-mono font-black text-sm text-emerald-400">
                    Ksh {item.price.toLocaleString()}
                  </span>
                  <button
                    disabled={!canAfford}
                    onClick={() => {
                      onBuyItem(item);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-md'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    Buy (Lipa)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
