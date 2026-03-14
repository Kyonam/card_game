import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    return NextResponse.json({ error: 'Google Script URL not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    
    // Server-to-server request (no CORS restrictions)
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.text();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
