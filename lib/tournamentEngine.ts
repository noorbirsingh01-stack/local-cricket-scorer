import { Match } from './db';

export interface TeamStats {
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
  nrr: number;
  form: string[];
}

// Helper to convert overs (e.g., 18.2) into decimals (18.333) for math
const overToDecimal = (overs: number, balls: number) => overs + (balls / 6);

export function generatePointsTable(matches: Match[]): TeamStats[] {
  const stats: Record<string, TeamStats> = {};

  const initTeam = (team: string) => {
    if (!stats[team]) {
      stats[team] = {
        teamName: team, matchesPlayed: 0, wins: 0, losses: 0, ties: 0,
        points: 0, runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0, nrr: 0, form: []
      };
    }
  };

  matches.filter(m => m.isCompleted).forEach(m => {
    initTeam(m.teamA);
    initTeam(m.teamB);

    stats[m.teamA].matchesPlayed += 1;
    stats[m.teamB].matchesPlayed += 1;

    // Calculate effective overs (If bowled out, effective overs = total scheduled overs)
    const teamAAllOut = m.inning1Wickets >= m.totalWickets;
    const teamBAllOut = m.inning2Wickets >= m.totalWickets;

    const teamAOversFaced = teamAAllOut ? m.totalOvers : overToDecimal(m.inning1Overs, m.inning1Balls);
    const teamBOversFaced = teamBAllOut ? m.totalOvers : overToDecimal(m.inning2Overs, m.inning2Balls);

    stats[m.teamA].runsScored += m.inning1Score;
    stats[m.teamA].oversFaced += teamAOversFaced;
    stats[m.teamA].runsConceded += m.inning2Score;
    stats[m.teamA].oversBowled += teamBOversFaced;

    stats[m.teamB].runsScored += m.inning2Score;
    stats[m.teamB].oversFaced += teamBOversFaced;
    stats[m.teamB].runsConceded += m.inning1Score;
    stats[m.teamB].oversBowled += teamAOversFaced;

    // Determine Winner
    if (m.inning1Score > m.inning2Score) {
      stats[m.teamA].wins += 1;
      stats[m.teamA].points += 2;
      stats[m.teamA].form.push('W');
      stats[m.teamB].losses += 1;
      stats[m.teamB].form.push('L');
    } else if (m.inning2Score > m.inning1Score) {
      stats[m.teamB].wins += 1;
      stats[m.teamB].points += 2;
      stats[m.teamB].form.push('W');
      stats[m.teamA].losses += 1;
      stats[m.teamA].form.push('L');
    } else {
      stats[m.teamA].ties += 1;
      stats[m.teamB].ties += 1;
      stats[m.teamA].points += 1;
      stats[m.teamB].points += 1;
      stats[m.teamA].form.push('D');
      stats[m.teamB].form.push('D');
    }
  });

  // Calculate NRR and Sort
  return Object.values(stats).map(team => {
    const runRateScored = team.oversFaced > 0 ? team.runsScored / team.oversFaced : 0;
    const runRateConceded = team.oversBowled > 0 ? team.runsConceded / team.oversBowled : 0;
    team.nrr = runRateScored - runRateConceded;
    // Keep form to last 5 matches
    team.form = team.form.slice(-5);
    return team;
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points; // Sort by points first
    return b.nrr - a.nrr; // Tie-breaker is NRR
  });
}