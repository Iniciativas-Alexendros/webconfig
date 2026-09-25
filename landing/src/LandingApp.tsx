import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeCycleButton } from "@/components/theme-toggle";

const FEATURES = [
  {
    title: "Determinista",
    body: "El mismo bundle produce el mismo archivo y los mismos hashes. Sirve para comparar versiones en CI.",
  },
  {
    title: "Formato congelado",
    body: "site.bundle v1.0.0 no cambia de esquema sin una decisión explícita. Los códigos de error se mantienen.",
  },
  {
    title: "Tokens con contraste",
    body: "Color en OKLCH, claro y oscuro, texto sobre fondo al menos 4.5:1 y bordes al menos 3:1.",
  },
  {
    title: "Local",
    body: "La comprobación de esquema puede hacerse en el navegador, con un archivo que abres tú. No hay cuentas.",
  },
] as const;

const FUNCTIONS = [
  { cmd: "init", body: "Crea un site.bundle starter válido." },
  { cmd: "validate", body: "Comprueba esquema y reglas semánticas, y devuelve códigos estables." },
  { cmd: "normalize", body: "Ordena YAML y JSON para que el diff muestre cambios reales." },
  { cmd: "export", body: "Empaqueta el sitio en un .tar.gz reproducible." },
  { cmd: "integrity", body: "Calcula huellas SHA-256 por fichero y un hash global." },
] as const;

const ROADMAP = [
  {
    status: "now" as const,
    label: "Disponible",
    title: "CLI de bundles",
    body: "init, validate, normalize, export e integrity sobre site.bundle v1.0.0.",
  },
  {
    status: "now" as const,
    label: "Disponible",
    title: "Design system",
    body: "Hojas DTCG v1.0, variables CSS, contraste y showcase de tokens. La landing usa esas variables.",
  },
  {
    status: "now" as const,
    label: "Disponible",
    title: "Esquema en el navegador",
    body: "La vista Validar del showcase abre un bundle con la File API y lo comprueba con AJV. No necesita servidor. El export tar y la validación semántica siguen en la CLI.",
  },
  {
    status: "out" as const,
    label: "Fuera de alcance",
    title: "Sin VPS ni alojamiento",
    body: "webconfig no despliega sitios, no administra un VPS y no promete cuentas, colaboración ni publicación.",
  },
] as const;

export function LandingApp() {
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="header sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="header-bar mx-auto flex max-w-[var(--breakpoint-xl)] flex-wrap items-center gap-4 px-4 py-3">
          <a
            className="wordmark text-xl font-bold tracking-tight text-[var(--foreground)] no-underline"
            href="#contenido"
          >
            webconfig
          </a>
          <nav className="flex flex-wrap gap-4" aria-label="Secciones">
            <a className="font-medium text-[var(--text-link)]" href="#caracteristicas">
              Características
            </a>
            <a className="font-medium text-[var(--text-link)]" href="#funcionalidades">
              Funcionalidades
            </a>
            <a className="font-medium text-[var(--text-link)]" href="#roadmap">
              Roadmap
            </a>
          </nav>
          <span className="flex-1" />
          <ThemeCycleButton locale="es" />
        </div>
      </header>
      <main id="contenido">
        <section className="hero mx-auto max-w-[var(--breakpoint-xl)] px-4 py-10" aria-labelledby="propuesta">
          <p className="kicker mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            CLI de site.bundle y design system
          </p>
          <h1 id="propuesta" className="max-w-[var(--breakpoint-lg)] text-4xl font-bold tracking-tight md:text-5xl">
            Comprueba y empaqueta sitios en el formato site.bundle, con tokens de diseño que puedes reutilizar.
          </h1>
        </section>
        <section
          className="features mx-auto max-w-[var(--breakpoint-xl)] px-4 py-8"
          id="caracteristicas"
          aria-labelledby="caracteristicas-titulo"
        >
          <h2 id="caracteristicas-titulo" className="mb-6 text-3xl font-bold tracking-tight">
            Características
          </h2>
          <ul className="features-list grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="feature">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-xl">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">{f.body}</CardDescription>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
        <section
          className="functions mx-auto max-w-[var(--breakpoint-xl)] px-4 py-8"
          id="funcionalidades"
          aria-labelledby="funcionalidades-titulo"
        >
          <h2 id="funcionalidades-titulo" className="mb-6 text-3xl font-bold tracking-tight">
            Funcionalidades
          </h2>
          <ul className="functions-list grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {FUNCTIONS.map((f) => (
              <li key={f.cmd} className="function">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="font-mono text-xl">
                      <code>{f.cmd}</code>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">{f.body}</CardDescription>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
        <section
          className="roadmap mx-auto max-w-[var(--breakpoint-xl)] px-4 py-8"
          id="roadmap"
          aria-labelledby="roadmap-titulo"
        >
          <h2 id="roadmap-titulo" className="mb-6 text-3xl font-bold tracking-tight">
            Roadmap
          </h2>
          <ol className="roadmap-list grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {ROADMAP.map((item) => (
              <li key={item.title} className="roadmap-item" data-status={item.status}>
                <Card className="h-full">
                  <CardHeader>
                    <Badge variant={item.status === "now" ? "success" : "secondary"} className="mb-2 w-fit">
                      {item.label}
                    </Badge>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">{item.body}</CardDescription>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="close border-t border-[var(--border)] bg-[var(--bg-surface)]" id="cierre">
        <div className="close-inner mx-auto max-w-[var(--breakpoint-xl)] px-4 py-10">
          <h2 className="text-3xl font-bold tracking-tight">Empieza por la CLI</h2>
          <p className="mt-3 mb-6 max-w-2xl text-[var(--muted-foreground)]">
            init, validate y export cubren el flujo. El design system es opt-in y no entra dentro del bundle.
          </p>
          <Button asChild>
            <a href="#funcionalidades">Ver funcionalidades</a>
          </Button>
        </div>
      </footer>
    </>
  );
}
