// middleware.ts
import { createMvpMiddleware } from '@payez/next-mvp';

export default createMvpMiddleware();

const matcherRegex = '/((?!api|_next/static|_next/image|favicon\\.ico).*)';

export const config = {
  matcher: [matcherRegex],
};
