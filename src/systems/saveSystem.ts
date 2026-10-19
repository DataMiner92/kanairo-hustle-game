import { GameSaveState, PlayerPosition, PlayerStats, MpesaTransaction, Mission, ShopItem } from '../types';

const SAVE_KEY = 'kanairo_mtaa_hustle_save_v1';

export class SaveSystem {
  public static hasSave(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(SAVE_KEY);
  }

  public static saveGame(
    stats: PlayerStats,
    pos: PlayerPosition,
    clock: { day: number; hour: number; minute: number },
    inventory: ShopItem[],
    mpesaHistory: MpesaTransaction[],
    completedMissionIds: string[],
    activeMission: Mission | null,
    availableMissionIds: string[],
    relationships: Record<string, number>
  ): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const state: GameSaveState = {
        version: 1,
        saveTime: new Date().toISOString(),
        playerStats: stats,
        playerPosition: { x: pos.x, y: pos.y, rotation: pos.rotation },
        clock,
        inventory,
        mpesaHistory,
        completedMissionIds,
        activeMission,
        availableMissionIds,
        relationships,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('Failed to save game:', e);
      return false;
    }
  }

  public static loadGame(): GameSaveState | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return null;
      return JSON.parse(data) as GameSaveState;
    } catch (e) {
      console.error('Failed to load game:', e);
      return null;
    }
  }

  public static clearSave(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SAVE_KEY);
  }
}
