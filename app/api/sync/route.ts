import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // In production, sync `payload.match` and `payload.balls` to your cloud DB
    console.log("Cloud Sync Payload Received:", payload);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({ 
      success: true, 
      message: "Match synced to cloud successfully.",
      shareableLink: `/live/${payload.match.id}` 
    });
    
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync match data" }, 
      { status: 500 }
    );
  }
}