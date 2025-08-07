import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Forward the request to the backend
    const response = await fetch('https://resume-bknd.onrender.com/health');
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}