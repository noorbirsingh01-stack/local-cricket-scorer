import Dexie, { Table } from 'dexie';

export interface BallEvent {
  id?: number;
  matchId: number;
  innings: number; 
  overNumber: number;
  ballNumber: number;
  batsmanRuns: number;
  extrasRuns: number;
  extraType: 'none' | 'wide' | 'noball' | 'bye' | 'legbye';
  isWicket: boolean;
  isLegalDelivery: boolean;
  batterName: string;
  bowlerName: string;
  timestamp: number;
}

export interface Match {
  id?: number;
  teamA: string; 
  teamB: string; 
  totalOvers: number;
  wicketsLimit: number;
  status: 'in_progress' | 'innings_break' | 'completed';
  innings: number; 
  target: number | null; 
  currentStriker: string;
  currentNonStriker: string;
  currentBowler: string;
  isWaitingForNewBatter: boolean;
  isWaitingForNewBowler: boolean;
  isWaitingForInningsBreak: boolean;
}

export class CricketEnterpriseDB extends Dexie {
  matches!: Table<Match, number>;
  balls!: Table<BallEvent, number>;

  constructor() {
    super('CricketEnterpriseDB');
    this.version(8).stores({
      matches: '++id, status, innings',
      balls: '++id, matchId, innings, overNumber, timestamp, batterName, bowlerName'
    });
  }
}

export const db = new CricketEnterpriseDB();