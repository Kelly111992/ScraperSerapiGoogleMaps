import { NextResponse } from 'next/server';
import { getJson } from 'serpapi';

export async function POST(request: Request) {
  console.log('API Route Hit');
  try {
    const body = await request.json();
    console.log('Request Body:', body);

    const { engine = 'google_maps', ...params } = body;
    const apiKey = process.env.SERPAPI_KEY;

    console.log('API Key present:', !!apiKey);
    if (!apiKey || apiKey === 'YOUR_SERPAPI_KEY_HERE') {
      console.error('API Key missing or default');
      return NextResponse.json({ error: 'Falta la API Key de SerpApi en .env.local' }, { status: 500 });
    }

    console.log('calling SerpApi getJson...');

    // Wrap getJson in a promise to handle the callback-based API
    const responseData = await new Promise((resolve, reject) => {
      getJson({
        engine,
        api_key: apiKey,
        ...params,
      }, (json: any) => {
        console.log('SerpApi Callback received');
        // Basic error checking from SerpApi response structure
        if (json.error) {
          console.error('SerpApi Error:', json.error);
          reject(new Error(json.error));
        } else {
          console.log('SerpApi Success');
          resolve(json);
        }
      });
    });

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Route Catch Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
