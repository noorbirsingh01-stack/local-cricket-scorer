import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { ball, match } = await request.json();

    let commentaryText = "";
    const totalRuns = ball.batsmanRuns + ball.extrasRuns;
    const battingTeam = ball.innings === 1 ? match.teamA : match.teamB;
    const bowlingTeam = ball.innings === 1 ? match.teamB : match.teamA;

    if (ball.isWicket) {
      commentaryText = `Wicket. ${ball.bowlerName} dismisses ${ball.batterName}.`;
    } else if (ball.extraType === 'wide') {
      commentaryText = `Wide delivery from ${ball.bowlerName}.`;
    } else if (ball.extraType === 'noball') {
      commentaryText = `No-ball called on ${ball.bowlerName}.`;
    } else if (totalRuns === 6) {
      commentaryText = `Six runs. Great shot by ${ball.batterName}.`;
    } else if (totalRuns === 4) {
      commentaryText = `Four runs. Boundary for ${ball.batterName}.`;
    } else if (totalRuns === 0) {
      commentaryText = `Dot ball bowled by ${ball.bowlerName}.`;
    } else {
      commentaryText = `${totalRuns} run(s) taken by ${ball.batterName}.`;
    }

    return NextResponse.json({ 
      success: true, 
      commentary: commentaryText,
      timestamp: new Date().toLocaleTimeString() 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}