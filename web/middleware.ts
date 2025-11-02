// // This function can be marked `async` if using `await` inside
// import {NextResponse} from 'next/server'
// import {isNativeMobile} from "web/lib/util/webview"
// import {RESERVED_PATHS} from "common/envs/constants";
//
// export function middleware(req: any) {
//   // const userAgent = req.headers.get('user-agent') || ''
//   const isMobile = isNativeMobile()
//
//   console.log(req.nextUrl.pathname)
//   const path = req.nextUrl.pathname.slice(1)
//   console.log(path)
//   if (
//     isMobile
//     && path.includes('_next')
//     && path.includes('.json')
//     // !path.includes('/') &&
//     // !RESERVED_PATHS.includes(path)
//   ) {
//     const url = new URL('https://compassmeet.com' + req.nextUrl.pathname)
//     // url.pathname = `/mobile${req.nextUrl.pathname}`
//     console.log('Rewriting to: ', JSON.stringify(url))
//     return NextResponse.redirect(url)
//   }
//
//   // return NextResponse.next()
// }
//
// // export const config = {
// //   matcher: [
// //     // Exclude API routes, static files, image optimizations, and .png files
// //     '/((?!api|_next/static|_next/image|.*\\.png$).*)',
// //   ],
// // }