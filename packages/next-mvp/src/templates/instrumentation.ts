/**
 * Next.js Instrumentation Hook Template
 *
 * Copy this file to your project root as `instrumentation.ts`
 *
 * This runs once when the server starts up (before any requests are handled).
 * It initializes the broker handshake to fetch OAuth providers and secrets from IDP.
 *
 * REQUIRED: Your next.config.js must have `output: 'standalone'` for this to work.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on Node.js runtime (not Edge)
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║            PayEz Next MVP - Server Startup                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    try {
      // Dynamically import at runtime to ensure server environment
      const { logStartupStatus, ensureInitialized } = await import(
        '@payez/next-mvp/lib/startup-init'
      );

      // Log startup status
      logStartupStatus();

      // Perform initialization (fetch client config from IDP including OAuth providers)
      await ensureInitialized();

      console.log('');
      console.log('Server startup initialization complete!');
      console.log('');
    } catch (error) {
      console.error('Server startup initialization failed:', error);
      console.error('Will retry initialization on first request.');
    }
  }
}
