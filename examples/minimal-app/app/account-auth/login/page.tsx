import Link from 'next/link';

export default function LoginPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Login</h1>
      <form method="post" action="/api/auth/login" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
        <label>
          <span>Username</span>
          <input name="username" type="text" required />
        </label>
        <label>
          <span>Password</span>
          <input name="password" type="password" required />
        </label>
        <button type="submit">Sign in</button>
      </form>
      <p style={{ marginTop: 16 }}>
        <Link href="/">Back</Link>
      </p>
    </main>
  );
}
