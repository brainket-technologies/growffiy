import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Extract Authorization header
  const authHeader = request.headers.get('authorization');

  // Check if header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or invalid token format' },
      { status: 401 }
    );
  }

  // Extract the token string
  const token = authHeader.split(' ')[1];

  // ==========================================
  // TOKEN VERIFICATION LOGIC GOES HERE
  // ==========================================
  // If you are using JWT, you can verify it using jsonwebtoken or jose:
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // For demonstration, we are using a static token comparison.
  // Replace this with your actual DB lookup or JWT verification logic.
  if (token !== 'growffi-secret-token') {
    return NextResponse.json(
      { error: 'Forbidden: Invalid token' },
      { status: 403 }
    );
  }

  // If token is valid, return the required data
  return NextResponse.json({
    success: true,
    message: 'Mobile API authenticated successfully',
    data: {
      appVersion: '1.0.0',
      user: {
        id: '123',
        name: 'Growffi User',
      }
    }
  }, { status: 200 });
}

export async function POST(request: Request) {
    // You can implement the same token logic for POST requests
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const token = authHeader.split(' ')[1];
  
    if (token !== 'growffi-secret-token') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  
    // Parse the body sent from mobile app
    try {
        const body = await request.json();
        return NextResponse.json({
            success: true,
            receivedData: body,
            message: 'Data processed successfully'
        });
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
}
