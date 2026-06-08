import "../admin.css";

export const metadata = {
  title: "Admin | Login",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const nextPath = typeof params?.next === "string" ? params.next : "/admin";
  const hasError = params?.error === "1";

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-label="Ingresar al panel privado">
        <p className="dashboard-kicker">Panel privado</p>
        <h1>Entrar al admin</h1>
        <form action="/api/admin/login" method="post">
          <input type="hidden" name="next" value={nextPath} />
          <label>
            Contraseña
            <input autoComplete="current-password" autoFocus name="password" required type="password" />
          </label>
          {hasError ? <p className="login-error">Contraseña incorrecta.</p> : null}
          <button type="submit">Entrar</button>
        </form>
      </section>
    </main>
  );
}
