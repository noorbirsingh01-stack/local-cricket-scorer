import Dexie, { Table } from 'dexie';

export interface Tournament {
  id: string;
  name: string;
  createdAt: number;
}

export interface BallEvent {
  id?: number;
  matchId: string;
  inning: 1 | 2;
  ballNumber: number;
  overNumber: number;
  batsman: string;
  bowler: string;
  batsmanRuns: number;
  extrasRuns: number;
  extraType: 'none' | 'wide' | 'noball' | 'bye' | 'legbye';
  isWicket: boolean;
  timestamp: number;
}

export interface Match {
  id: string;
  tournamentId?: string; // NEW: Links match to a tournament
  teamA: string;
  teamB: string;
  totalOvers: number;
  totalWickets: number;
  currentInning: 1 | 2;
  battingTeam: string;
  bowlingTeam: string;
  
  inning1Score: number;
  inning1Wickets: number;
  inning1Overs: number;
  inning1Balls: number;
  
  inning2Score: number;
  inning2Wickets: number;
  inning2Overs: number;
  inning2Balls: number;
  target?: number;

  striker: string;
  nonStriker: string;
  bowler: string;

  isCompleted: boolean;
  isWaitingForNewBatter: boolean;
  isWaitingForNewBowler: boolean;
  isInningsBreak: boolean;
  resultSummary?: string;
  createdAt: number;
}

export class CricketDatabase extends Dexie {
  tournaments!: Table<Tournament, string>;
  matches!: Table<Match, string>;
  balls!: Table<BallEvent, number>;

  constructor() {
    super('GullyCricketProDB');
    // Upgraded to Version 9 to support Tournaments
    this.version(9).stores({
      tournaments: 'id, createdAt',
      matches: 'id, tournamentId, teamA, teamB, createdAt, isCompleted',
      balls: '++id, matchId, inning, overNumber, timestamp'
    });
  }
}

export const db = new CricketDatabase();