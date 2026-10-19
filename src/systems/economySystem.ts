import { MpesaTransaction, PlayerStats } from '../types';
import { soundEngine } from '../audio/soundEngine';
import { particleSystem } from '../engine/particleSystem';

export class EconomySystem {
  public static generateMpesaCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SH';
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public static getInitialHistory(): MpesaTransaction[] {
    return [
      {
        id: 'tx_init',
        code: 'SH840192K',
        type: 'RECEIVED',
        party: 'JEMO 0722***819',
        amount: 200,
        timestamp: 'Day 1, 07:45 AM',
        balanceAfter: 200,
        note: 'Karibu Kanairo, shika hii ya kuanzia.',
      },
    ];
  }

  public static credit(
    stats: PlayerStats,
    history: MpesaTransaction[],
    amount: number,
    source: string,
    timeStr: string,
    playerX?: number,
    playerY?: number
  ): MpesaTransaction {
    stats.money += amount;
    const tx: MpesaTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      code: this.generateMpesaCode(),
      type: 'RECEIVED',
      party: source,
      amount,
      timestamp: timeStr,
      balanceAfter: stats.money,
      note: `Received Ksh ${amount.toLocaleString()}`,
    };

    history.unshift(tx);
    soundEngine.playMpesaChime();

    if (playerX !== undefined && playerY !== undefined) {
      particleSystem.addFloatingText(`+Ksh ${amount.toLocaleString()} M-PESA 📲`, playerX, playerY - 30, '#22c55e');
    }

    return tx;
  }

  public static debit(
    stats: PlayerStats,
    history: MpesaTransaction[],
    amount: number,
    recipient: string,
    timeStr: string,
    type: 'SENT' | 'PAYBILL' | 'BUY_GOODS' = 'BUY_GOODS',
    playerX?: number,
    playerY?: number
  ): boolean {
    if (stats.money < amount) {
      if (playerX !== undefined && playerY !== undefined) {
        particleSystem.addFloatingText('Pesa Haikutoshi kwa M-PESA! ❌', playerX, playerY - 30, '#ef4444');
      }
      return false;
    }

    stats.money -= amount;
    const tx: MpesaTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      code: this.generateMpesaCode(),
      type,
      party: recipient,
      amount,
      timestamp: timeStr,
      balanceAfter: stats.money,
      note: `Paid Ksh ${amount.toLocaleString()} to ${recipient}`,
    };

    history.unshift(tx);
    soundEngine.playCashRegister();

    if (playerX !== undefined && playerY !== undefined) {
      particleSystem.addFloatingText(`-Ksh ${amount.toLocaleString()} 💸`, playerX, playerY - 30, '#f59e0b');
    }

    return true;
  }
}
