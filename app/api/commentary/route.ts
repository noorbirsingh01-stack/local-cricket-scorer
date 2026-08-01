import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { batsman, bowler, batsmanRuns, extrasRuns, extraType, isWicket } = body;

    let commentary = "";
    if (isWicket) {
      commentary = `OUT! ${bowler} strikes! Dismissed batter departs after a brilliant effort.`;
    } else if (extraType === 'wide') {
      commentary = `Wide ball bowled by ${bowler}. Extra run added.`;
    } else if (extraType === 'noball') {
      commentary = `No ball! ${bowler} oversteps. Free hit coming up!`;
    } else if (batsmanRuns === 6) {
      commentary = `SIX RUNS! Massive hit by ${batsman} off ${bowler}! Sent sailing into the stands!`;
    } else if (batsmanRuns === 4) {
      commentary = `FOUR RUNS! Beautiful stroke by ${batsman} off ${bowler}, racing across the turf to the boundary!`;
    } else if (batsmanRuns === 1 || batsmanRuns === 3) {
      commentary = `${batsman} works it away for ${batsmanRuns} run(s) off ${bowler}.`;
    } else if (batsmanRuns === 2) {
      commentary = `Good running between the wickets! ${batsman} picks up 2 runs off ${bowler}.`;
    } else {
      commentary = `Dot ball. Defended solidly by ${batsman} against ${bowler}.`;
    }

    return NextResponse.json({ commentary });
  } catch (error) {
    return NextResponse.json({ commentary: "Ball recorded successfully." }, { status: 200 });
  }
}