import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const url = new URL(req.url);
  url.pathname = '/api/v1/audit';
  return fetch(url.toString(), {
    method: 'POST',
    headers: req.headers,
    body: await req.text(),
  });
}
