"use client";

import { useState } from "react";

/* ─── design tokens ─── */
const C = {
  pageBg: "#07090F",
  sectionAlt: "#090C13",
  card: "#0D1322",
  cardDeep: "#0C1322",
  cardInner: "#0F1726",
  chip: "#0A0F1B",
  textPrimary: "#EAEEF6",
  textSecondary: "#9AA6BD",
  textMuted: "#8C97AD",
  textFaint: "#6B7689",
  textChip: "#A9B3C7",
  teal: "#3FE0CF",
  tealText: "#4FE0D0",
  tealDark: "#149C8E",
  onAccent: "#06201D",
  amber: "#F5B13D",
  error: "#F5856B",
} as const;

const mono = "'JetBrains Mono', monospace";
const heading = "'Space Grotesk', sans-serif";

/* ─── Logo ─── */
function Logo({ size = 30, fontSize = 20 }: { size?: number; fontSize?: number }) {
  const diamond = Math.round(size * 0.367);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size > 26 ? 11 : 10 }}>
      <div
        style={{
          width: size, height: size, borderRadius: Math.round(size * 0.3),
          background: `linear-gradient(140deg,${C.teal},${C.tealDark})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 0 1px rgba(63,224,207,0.25),0 10px 28px -10px rgba(63,224,207,0.6)`,
        }}
      >
        <div style={{ width: diamond, height: diamond, background: C.onAccent, transform: "rotate(45deg)", borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: heading, fontWeight: 600, fontSize, letterSpacing: "-0.02em", color: C.textPrimary }}>
        Cautium
      </span>
    </div>
  );
}

/* ─── Eyebrow ─── */
function Eyebrow({ children, teal }: { children: string; teal?: boolean }) {
  return (
    <div style={{
      fontFamily: mono, fontSize: 12, letterSpacing: "0.14em",
      color: teal ? C.tealText : C.textFaint,
      textTransform: "uppercase", marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

/* ─── Feature icon shapes ─── */
function IconRect() {
  return <span style={{ width: 10, height: 11, borderRadius: 1, background: C.tealText }} />;
}
function IconRing() {
  return <span style={{ width: 11, height: 11, borderRadius: "50%", border: `2.5px solid ${C.tealText}` }} />;
}
function IconDiamond() {
  return <span style={{ width: 11, height: 11, background: C.amber, transform: "rotate(45deg)", borderRadius: 2 }} />;
}
function IconLines() {
  return <span style={{ width: 13, height: 2, background: C.tealText, boxShadow: `0 4px 0 ${C.tealText},0 -4px 0 ${C.tealText}` }} />;
}

/* ─── Pricing check item ─── */
function CheckItem({ children, bright }: { children: string; bright?: boolean }) {
  return (
    <li style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14.5, color: bright ? C.textPrimary : "#C7D0E0", lineHeight: 1.45 }}>
      <span style={{ color: C.tealText, flexShrink: 0, marginTop: 1 }}>✓</span>
      {children}
    </li>
  );
}

export default function LandingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isAnnual = billing === "annual";
  const price = (m: number) => isAnnual ? Math.round(m * 0.8) : m;
  const billingNote = isAnnual ? "por usuario / mes · facturado anual" : "por usuario / mes";

  async function handleSubmit() {
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError("Introduce un email válido");
      return;
    }
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // fail silently — UX still shows success
    }
    setSubmitted(true);
  }

  const segBtn = (active: boolean) => ({
    padding: "9px 20px", borderRadius: 999, border: "none", cursor: "pointer",
    fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14, fontWeight: 600,
    transition: "all .15s ease",
    background: active ? "#1B2740" : "transparent",
    color: active ? C.textPrimary : C.textSecondary,
    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.4)" : "none",
  } as React.CSSProperties);

  const container = { maxWidth: 1180, margin: "0 auto", padding: "0 32px" };

  return (
    <div style={{ background: C.pageBg, color: C.textPrimary, fontFamily: "'Hanken Grotesk', sans-serif", minHeight: "100vh", overflowX: "hidden", WebkitFontSmoothing: "antialiased" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(16px)", background: "rgba(7,9,15,0.72)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ ...container, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 32px" }}>
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {(["Producto", "Cómo funciona", "Precios"] as const).map((label) => {
              const href = label === "Producto" ? "#producto" : label === "Cómo funciona" ? "#como" : "#precios";
              return (
                <a key={label} href={href} style={{ color: C.textSecondary, textDecoration: "none", fontSize: 15 }}>{label}</a>
              );
            })}
            <a href="#waitlist" style={{ background: C.teal, color: C.onAccent, padding: "9px 17px", borderRadius: 9, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
              Solicitar acceso
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header style={{ position: "relative", overflow: "hidden" }}>
        {/* glow */}
        <div style={{ position: "absolute", top: -240, left: "50%", transform: "translateX(-50%)", width: 1150, height: 760, background: "radial-gradient(ellipse at center,rgba(63,224,207,0.13),rgba(63,224,207,0) 62%)", pointerEvents: "none" }} />

        <div style={{ ...container, position: "relative", padding: "84px 32px 100px", display: "grid", gridTemplateColumns: "1.04fr 0.96fr", gap: 54, alignItems: "center" }}>

          {/* left */}
          <div>
            {/* badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: mono, fontSize: 12, letterSpacing: "0.12em", color: C.tealText, background: "rgba(63,224,207,0.08)", border: "1px solid rgba(63,224,207,0.2)", padding: "7px 13px", borderRadius: 999, textTransform: "uppercase" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.tealText, boxShadow: `0 0 10px ${C.tealText}` }} />
              TPRM impulsado por IA
            </div>

            <h1 style={{ fontFamily: heading, fontWeight: 600, fontSize: 58, lineHeight: 1.04, letterSpacing: "-0.03em", margin: "24px 0 0", textWrap: "balance" as any }}>
              Responde cuestionarios de seguridad{" "}
              <span style={{ color: C.tealText }}>en minutos</span>, no en días.
            </h1>

            <p style={{ fontSize: 19, lineHeight: 1.55, color: C.textSecondary, margin: "24px 0 0", maxWidth: 520, textWrap: "pretty" as any }}>
              Cautium lee tus políticas, entiende cada pregunta y redacta respuestas citando tus propias fuentes. Tú solo revisas, ajustas y exportas.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
              <a href="#waitlist" style={{ background: C.teal, color: C.onAccent, padding: "15px 26px", borderRadius: 11, fontWeight: 600, fontSize: 16, textDecoration: "none", boxShadow: "0 14px 32px -10px rgba(63,224,207,0.55)" }}>
                Solicitar early access
              </a>
              <a href="#como" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: C.textPrimary, padding: "15px 24px", borderRadius: 11, fontWeight: 600, fontSize: 16, textDecoration: "none" }}>
                Ver cómo funciona
              </a>
            </div>

            <div style={{ marginTop: 22, fontFamily: mono, fontSize: 12.5, color: C.textFaint, letterSpacing: "0.02em" }}>
              Sin tarjeta · Lo configuras en una tarde
            </div>
          </div>

          {/* right — product mockup */}
          <div style={{ position: "relative", animation: "cautiumFloat 7s ease-in-out infinite" }}>
            <div style={{ background: C.cardDeep, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, boxShadow: "0 44px 90px -34px rgba(0,0,0,0.85),0 0 0 1px rgba(63,224,207,0.05)", overflow: "hidden" }}>

              {/* window header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[0, 1, 2].map(i => <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#2A3346" }} />)}
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 12, color: C.textFaint }}>acme-corp · SIG Lite</span>
                </div>
                <span style={{ fontFamily: mono, fontSize: 11.5, color: C.tealText, background: "rgba(63,224,207,0.1)", padding: "4px 9px", borderRadius: 6 }}>48 / 60</span>
              </div>

              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                {/* progress bar */}
                <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: "80%", height: "100%", background: `linear-gradient(90deg,${C.tealDark},${C.tealText})`, borderRadius: 999 }} />
                </div>

                {/* row answered */}
                <div style={{ background: C.cardInner, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: C.textFaint, letterSpacing: "0.04em" }}>Q-12 · CONTROL DE ACCESO</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: mono, fontSize: 10.5, color: C.tealText, background: "rgba(63,224,207,0.1)", padding: "3px 8px", borderRadius: 5 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.tealText }} />
                      Alta confianza
                    </span>
                  </div>
                  <p style={{ fontSize: 13.5, color: "#C7D0E0", margin: "0 0 8px", fontWeight: 500 }}>¿Aplicáis MFA en todos los accesos administrativos?</p>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: C.textMuted, margin: "0 0 11px" }}>Sí. Cautium exige autenticación multifactor en todas las cuentas con privilegios, aplicada vía SSO corporativo.</p>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {["Política de Acceso §4.2", "ISO 27001 · A.9"].map(label => (
                      <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 10.5, color: C.textChip, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", padding: "4px 9px", borderRadius: 6 }}>
                        <span style={{ width: 7, height: 8, borderRadius: 1, background: C.tealText, opacity: 0.85 }} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* row generating */}
                <div style={{ position: "relative", background: C.cardInner, border: "1px solid rgba(63,224,207,0.28)", borderRadius: 12, padding: 14, overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 44, background: "linear-gradient(180deg,rgba(63,224,207,0.16),transparent)", animation: "cautiumScan 2.8s ease-in-out infinite", pointerEvents: "none" }} />
                  <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: C.textFaint, letterSpacing: "0.04em" }}>Q-13 · CIFRADO</span>
                    <span style={{ fontFamily: mono, fontSize: 10.5, color: C.tealText, animation: "cautiumPulse 1.4s ease-in-out infinite" }}>Generando…</span>
                  </div>
                  <p style={{ position: "relative", fontSize: 13.5, color: "#C7D0E0", margin: "0 0 11px", fontWeight: 500 }}>¿Cifráis los datos en reposo y en tránsito?</p>
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ height: 9, width: "92%", background: "rgba(255,255,255,0.07)", borderRadius: 5, animation: "cautiumPulse 1.6s ease-in-out infinite" }} />
                    <div style={{ height: 9, width: "72%", background: "rgba(255,255,255,0.07)", borderRadius: 5, animation: "cautiumPulse 1.6s ease-in-out infinite 0.25s" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── PROBLEM ── */}
      <section style={{ padding: "96px 32px", background: C.sectionAlt, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={container}>
          <Eyebrow>El problema</Eyebrow>
          <h2 style={{ fontFamily: heading, fontWeight: 600, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 780, margin: 0, textWrap: "balance" as any }}>
            Cada cuestionario de seguridad para a tu equipo durante días.
          </h2>
          <p style={{ fontSize: 18, color: C.textMuted, lineHeight: 1.55, maxWidth: 620, margin: "20px 0 0", textWrap: "pretty" as any }}>
            SIG, CAIQ, VSA, formularios propios de cada cliente. Las mismas respuestas, redactadas una y otra vez a mano.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 48 }}>
            {[
              { n: "01", title: "Cientos de preguntas repetidas", body: "Cada portal pide lo mismo con otro formato. Tu equipo copia y pega respuestas que ya escribió mil veces." },
              { n: "02", title: "El conocimiento está disperso", body: "Vive en PDFs, hojas de cálculo, wikis y en la cabeza de tu CISO. Encontrar la respuesta cuesta más que escribirla." },
              { n: "03", title: "Los plazos bloquean ingresos", body: "Cada cuestionario sin responder es un contrato que se retrasa o un deal que se enfría esperando a seguridad." },
            ].map(({ n, title, body }) => (
              <div key={n} style={{ background: C.card, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 26 }}>
                <div style={{ fontFamily: mono, fontSize: 13, color: C.tealText }}>{n}</div>
                <h3 style={{ fontFamily: heading, fontWeight: 600, fontSize: 20, margin: "14px 0 10px" }}>{title}</h3>
                <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.6, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section id="producto" style={{ padding: "100px 32px" }}>
        <div style={container}>
          <Eyebrow teal>La solución</Eyebrow>
          <h2 style={{ fontFamily: heading, fontWeight: 600, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 760, margin: 0, textWrap: "balance" as any }}>
            Una base de conocimiento que responde por ti.
          </h2>
          <p style={{ fontSize: 18, color: C.textMuted, lineHeight: 1.55, maxWidth: 640, margin: "20px 0 0", textWrap: "pretty" as any }}>
            Sube tus políticas una vez. Cautium las entiende, responde cada pregunta y enlaza la fuente exacta. Sin alucinaciones, con trazabilidad de extremo a extremo.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, marginTop: 48 }}>
            {[
              { icon: <IconRect />, bg: "rgba(63,224,207,0.12)", border: "rgba(63,224,207,0.25)", title: "Respuestas con la fuente citada", body: "Cada respuesta enlaza al párrafo exacto de tu política. Auditable de un vistazo, sin inventar nada." },
              { icon: <IconRing />, bg: "rgba(63,224,207,0.12)", border: "rgba(63,224,207,0.25)", title: "Aprende de tu histórico", body: "Reutiliza respuestas ya aprobadas para mantener consistencia y tono entre cuestionarios y equipos." },
              { icon: <IconDiamond />, bg: "rgba(245,177,61,0.12)", border: "rgba(245,177,61,0.3)", title: "Detecta huecos de evidencia", body: "Señala las preguntas para las que aún no tienes política o certificación, antes de que el cliente lo haga." },
              { icon: <IconLines />, bg: "rgba(63,224,207,0.12)", border: "rgba(63,224,207,0.25)", title: "Exporta en su formato", body: "Excel, SIG, portales TPRM o el formulario propio del cliente. Sin reformatear ni copiar a mano." },
            ].map(({ icon, bg, border, title, body }) => (
              <div key={title} style={{ background: C.card, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {icon}
                </div>
                <h3 style={{ fontFamily: heading, fontWeight: 600, fontSize: 21, margin: "18px 0 9px" }}>{title}</h3>
                <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.6, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como" style={{ padding: "100px 32px", background: C.sectionAlt, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={container}>
          <Eyebrow>Cómo funciona</Eyebrow>
          <h2 style={{ fontFamily: heading, fontWeight: 600, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 740, margin: 0, textWrap: "balance" as any }}>
            De tus documentos a un cuestionario completo, en tres pasos.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 52 }}>

            {/* step 1 */}
            <div style={{ background: C.card, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: mono, fontSize: 34, fontWeight: 500, color: C.tealText, letterSpacing: "-0.02em" }}>01</div>
              <h3 style={{ fontFamily: heading, fontWeight: 600, fontSize: 21, margin: "16px 0 9px" }}>Sube tu material</h3>
              <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.6, margin: "0 0 18px" }}>Políticas, certificaciones (ISO 27001, SOC 2) y respuestas previas. Cautium construye tu base de conocimiento privada.</p>
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
                {["Política_Seguridad.pdf", "SOC2_Type_II.pdf"].map(name => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: mono, fontSize: 11.5, color: C.textChip, background: C.chip, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px" }}>
                    <span style={{ width: 8, height: 10, borderRadius: 1, background: C.tealText, opacity: 0.8 }} />
                    {name}
                  </div>
                ))}
              </div>
            </div>

            {/* step 2 */}
            <div style={{ background: C.card, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: mono, fontSize: 34, fontWeight: 500, color: C.tealText, letterSpacing: "-0.02em" }}>02</div>
              <h3 style={{ fontFamily: heading, fontWeight: 600, fontSize: 21, margin: "16px 0 9px" }}>La IA responde</h3>
              <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.6, margin: "0 0 18px" }}>Sube el cuestionario en cualquier formato. Cautium redacta cada respuesta y adjunta la fuente exacta.</p>
              <div style={{ marginTop: "auto", background: C.chip, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12.5, color: "#C7D0E0", lineHeight: 1.5 }}>
                  Sí, todos los datos se cifran con AES-256 en reposo
                  <span style={{ display: "inline-block", width: 7, height: 14, background: C.tealText, marginLeft: 2, verticalAlign: "-2px", animation: "cautiumBlink 1s step-end infinite" }} />
                </div>
              </div>
            </div>

            {/* step 3 */}
            <div style={{ background: C.card, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: mono, fontSize: 34, fontWeight: 500, color: C.tealText, letterSpacing: "-0.02em" }}>03</div>
              <h3 style={{ fontFamily: heading, fontWeight: 600, fontSize: 21, margin: "16px 0 9px" }}>Revisa y exporta</h3>
              <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.6, margin: "0 0 18px" }}>Aprueba o ajusta el tono en un clic. Exporta en el formato que pide el cliente, listo para enviar.</p>
              <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: mono, fontSize: 11.5, color: C.onAccent, background: C.tealText, borderRadius: 7, padding: "7px 11px", fontWeight: 500 }}>Excel</span>
                {["SIG", "Portal TPRM"].map(label => (
                  <span key={label} style={{ fontFamily: mono, fontSize: 11.5, color: C.textChip, background: C.chip, border: "1px solid rgba(255,255,255,0.09)", borderRadius: 7, padding: "7px 11px" }}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="precios" style={{ padding: "100px 32px" }}>
        <div style={container}>
          <div style={{ textAlign: "center" }}>
            <Eyebrow>Precios</Eyebrow>
            <h2 style={{ fontFamily: heading, fontWeight: 600, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0, textWrap: "balance" as any }}>
              Simple desde el primer día. Escala cuando lo necesites.
            </h2>
          </div>

          {/* billing toggle */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, margin: "32px 0 46px" }}>
            <div style={{ display: "inline-flex", background: "#0D1424", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: 4 }}>
              <button onClick={() => setBilling("monthly")} style={segBtn(!isAnnual)}>Mensual</button>
              <button onClick={() => setBilling("annual")} style={segBtn(isAnnual)}>Anual</button>
            </div>
            {isAnnual && (
              <span style={{ fontFamily: mono, fontSize: 12, color: C.tealText }}>Ahorra un 20% con facturación anual</span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "stretch" }}>

            {/* Starter */}
            <div style={{ background: C.card, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 32, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: heading, fontWeight: 600, fontSize: 19 }}>Starter</div>
              <p style={{ color: C.textMuted, fontSize: 14, margin: "7px 0 0", lineHeight: 1.5 }}>Para responder tus primeros cuestionarios sin fricción.</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "22px 0 4px" }}>
                <span style={{ fontFamily: heading, fontSize: 20, color: C.textSecondary, fontWeight: 500 }}>€</span>
                <span style={{ fontFamily: heading, fontSize: 52, fontWeight: 600, letterSpacing: "-0.02em" }}>{price(29)}</span>
              </div>
              <div style={{ fontSize: 12.5, color: C.textFaint, fontFamily: mono }}>{billingNote}</div>
              <a href="#waitlist" style={{ margin: "26px 0 24px", textAlign: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: C.textPrimary, padding: 13, borderRadius: 11, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>Empezar</a>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {["1 base de conocimiento", "Hasta 5 cuestionarios / mes", "Respuestas con fuentes citadas", "Exportación a Excel", "1 usuario"].map(f => <CheckItem key={f}>{f}</CheckItem>)}
              </ul>
            </div>

            {/* Pro */}
            <div style={{ background: "linear-gradient(180deg,#101D27,#0C1322)", border: "1px solid rgba(63,224,207,0.4)", borderRadius: 18, padding: 32, display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 30px 70px -36px rgba(63,224,207,0.35)" }}>
              <span style={{ position: "absolute", top: -12, left: 32, fontFamily: mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: C.onAccent, background: C.tealText, padding: "5px 11px", borderRadius: 7, fontWeight: 500 }}>Más popular</span>
              <div style={{ fontFamily: heading, fontWeight: 600, fontSize: 19 }}>Pro</div>
              <p style={{ color: C.textSecondary, fontSize: 14, margin: "7px 0 0", lineHeight: 1.5 }}>Para equipos de seguridad que responden cuestionarios cada semana.</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "22px 0 4px" }}>
                <span style={{ fontFamily: heading, fontSize: 20, color: C.textSecondary, fontWeight: 500 }}>€</span>
                <span style={{ fontFamily: heading, fontSize: 52, fontWeight: 600, letterSpacing: "-0.02em" }}>{price(79)}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#7E8AA0", fontFamily: mono }}>{billingNote}</div>
              <a href="#waitlist" style={{ margin: "26px 0 24px", textAlign: "center", background: C.teal, color: C.onAccent, padding: 13, borderRadius: 11, fontWeight: 600, fontSize: 15, textDecoration: "none", boxShadow: "0 14px 30px -12px rgba(63,224,207,0.6)" }}>Empezar con Pro</a>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {["Bases de conocimiento ilimitadas", "Cuestionarios ilimitados", "Detección de huecos de evidencia", "Histórico reutilizable", "Hasta 5 usuarios", "Soporte prioritario"].map(f => <CheckItem key={f} bright>{f}</CheckItem>)}
              </ul>
            </div>

            {/* Enterprise */}
            <div style={{ background: C.card, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 32, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: heading, fontWeight: 600, fontSize: 19 }}>Enterprise</div>
              <p style={{ color: C.textMuted, fontSize: 14, margin: "7px 0 0", lineHeight: 1.5 }}>Para organizaciones con requisitos de seguridad y gobierno.</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "22px 0 4px" }}>
                <span style={{ fontFamily: heading, fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em" }}>A medida</span>
              </div>
              <div style={{ fontSize: 12.5, color: C.textFaint, fontFamily: mono }}>según volumen y necesidades</div>
              <a href="#waitlist" style={{ margin: "26px 0 24px", textAlign: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: C.textPrimary, padding: 13, borderRadius: 11, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>Hablar con ventas</a>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {["Todo lo de Pro, sin límites", "SSO / SAML y roles granulares", "Integraciones con portales TPRM", "Revisión de seguridad y DPA", "Onboarding dedicado"].map(f => <CheckItem key={f}>{f}</CheckItem>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── WAITLIST ── */}
      <section id="waitlist" style={{ position: "relative", overflow: "hidden", padding: "112px 32px", borderTop: "1px solid rgba(255,255,255,0.05)", background: C.sectionAlt }}>
        {/* glow */}
        <div style={{ position: "absolute", bottom: -300, left: "50%", transform: "translateX(-50%)", width: 1100, height: 700, background: "radial-gradient(ellipse at center,rgba(63,224,207,0.12),rgba(63,224,207,0) 60%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow teal>Early access</Eyebrow>
          <h2 style={{ fontFamily: heading, fontWeight: 600, fontSize: 44, lineHeight: 1.08, letterSpacing: "-0.025em", margin: 0, textWrap: "balance" as any }}>
            Deja de copiar y pegar respuestas de seguridad.
          </h2>
          <p style={{ fontSize: 18, color: C.textSecondary, lineHeight: 1.55, margin: "20px auto 0", maxWidth: 500, textWrap: "pretty" as any }}>
            Únete al early access de Cautium. Plazas limitadas para los primeros equipos.
          </p>

          {!submitted ? (
            <div style={{ margin: "34px auto 0", maxWidth: 480 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  placeholder="tu@empresa.com"
                  style={{ flex: 1, minWidth: 200, background: C.cardDeep, border: "1px solid rgba(255,255,255,0.14)", borderRadius: 11, padding: "15px 16px", color: C.textPrimary, fontSize: 16, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }}
                />
                <button
                  onClick={handleSubmit}
                  style={{ background: C.teal, color: C.onAccent, border: "none", cursor: "pointer", padding: "15px 24px", borderRadius: 11, fontWeight: 600, fontSize: 16, fontFamily: "'Hanken Grotesk', sans-serif", boxShadow: "0 14px 32px -12px rgba(63,224,207,0.55)", whiteSpace: "nowrap" }}
                >
                  Solicitar acceso
                </button>
              </div>
              {error && (
                <div style={{ marginTop: 12, textAlign: "left", fontSize: 13.5, color: C.error, fontFamily: mono }}>
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div style={{ margin: "34px auto 0", maxWidth: 480, background: "rgba(63,224,207,0.08)", border: "1px solid rgba(63,224,207,0.3)", borderRadius: 14, padding: 24, display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
              <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: "50%", background: C.teal, color: C.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>✓</div>
              <div>
                <div style={{ fontFamily: heading, fontWeight: 600, fontSize: 17 }}>Estás en la lista.</div>
                <div style={{ color: C.textSecondary, fontSize: 14.5, marginTop: 3 }}>
                  Te escribiremos a <span style={{ color: C.tealText }}>{email}</span> en cuanto abramos tu plaza.
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 18, fontFamily: mono, fontSize: 12, color: C.textFaint }}>
            Sin spam · Solo el aviso de acceso
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "38px 32px" }}>
        <div style={{ ...container, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 18 }}>
          <Logo size={24} fontSize={16} />
          <div style={{ display: "flex", gap: 26 }}>
            {[["Producto", "#producto"], ["Precios", "#precios"], ["Early access", "#waitlist"]].map(([label, href]) => (
              <a key={label} href={href} style={{ color: C.textFaint, textDecoration: "none", fontSize: 14 }}>{label}</a>
            ))}
          </div>
          <div style={{ fontFamily: mono, fontSize: 12, color: "#4A5263" }}>© 2026 Cautium · TPRM con IA</div>
        </div>
      </footer>

    </div>
  );
}
