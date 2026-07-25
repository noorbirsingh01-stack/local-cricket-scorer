import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json({ success: false, error: 'No transcript provided' }, { status: 400 });
    }

    const lower = transcript.toLowerCase();
    let runs = 0;
    let isWicket = false;
    let isWide = false;

    // Cricket Natural Language Parsing Logic
    if (lower.includes('six') || lower.includes('6') || lower.includes('maximum')) runs = 6;
    else if (lower.includes('four') || lower.includes('4') || lower.includes('boundary')) runs = 4;
    else if (lower.includes('three') || lower.includes('3')) runs = 3;
    else if (lower.includes('two') || lower.includes('2') || lower.includes('double')) runs = 2;
    else if (lower.includes('one') || lower.includes('1') || lower.includes('single')) runs = 1;
    else if (lower.includes('dot') || lower.includes('zero') || lower.includes('no run')) runs = 0;

    if (lower.includes('wicket') || lower.includes('out') || lower.includes('catch') || lower.includes('bowled')) {
      isWicket = true;
    }

    if (lower.includes('wide')) {
      isWide = true;
    }

    return NextResponse.json({
      success: true,
      parsed: {
        runs,
        isWicket,
        isWide,
        rawText: transcript
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to process voice command' }, { status: 500 });
  }
}