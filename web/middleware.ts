import { NextResponse } from 'next/server';
export function middleware(req: any) {
  const lang = req.cookies.get('lang') ?? 'en';
  req.nextUrl.searchParams.set('lang', lang);
  return NextResponse.next();
}