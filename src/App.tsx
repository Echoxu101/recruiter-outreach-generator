import { useState, useRef, type CSSProperties, type ReactNode } from "react";

const TONES = ["Professional", "Friendly", "Casual", "Enthusiastic"] as const;
const PLATFORMS = ["Email", "LinkedIn", "WhatsApp", "WeChat"] as const;
const LANGUAGES = ["English", "中文", "日本語", "Español", "Français", "Deutsch"] as const;

type Tone = typeof TONES[number];
type Platform = typeof PLATFORMS[number];
type Language = typeof LANGUAGES[number];

const s = {
  bg: "#f9f7f4", surface: "#f3f0eb", surface2: "#ece9e3",
  border: "#dedad4", border2: "#ccc8c2",
  text: "#1a1a1a", text2: "#5a5450", muted: "#9a9490",
};

const globalStyles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${s.bg}; font-family: 'Segoe UI', system-ui, sans-serif; }
  input, textarea { transition: border-color .15s; }
  input:focus, textarea:focus { border-color: ${s.text} !important; outline: none; }
  input::placeholder, textarea::placeholder { color: ${s.muted}; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 700px) { .layout { grid-template-columns: 1fr !important; } }
`;

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 100, fontFamily: "inherit",
      border: `1.5px solid ${active ? s.text : s.border2}`,
      background: active ? s.surface2 : s.surface,
      color: active ? s.text : s.muted,
      cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, transition: "all .15s",
    }}>{children}</button>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 18px", borderRadius: 8, fontFamily: "inherit",
      border: `1.5px solid ${active ? s.text : s.border2}`,
      background: active ? s.text : s.surface2,
      color: active ? s.bg : s.text2,
      cursor: "pointer", fontWeight: active ? 700 : 400, fontSize: 13, transition: "all .15s",
    }}>{children}</button>
  );
}

function Field({ label, required, hint, optional, children }: {
  label: string; required?: boolean; hint?: string; optional?: boolean; children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: s.text2, marginBottom: 4 }}>
        {label}
        {required && <span style={{ color: "#c0392b" }}> *</span>}
        {optional && <span style={{ color: s.muted, fontWeight: 400 }}> (optional)</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 12, color: s.muted, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

const inputSt: CSSProperties = {
  width: "100%", padding: "9px 11px", borderRadius: 8,
  border: `1.5px solid ${s.border2}`, fontSize: ".85rem",
  fontFamily: "inherit", background: s.surface2, color: s.text,
};


export default function App() {
  const [tab, setTab] = useState<"url" | "resume">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [platform, setPlatform] = useState<Platform>("Email");
  const [language, setLanguage] = useState<Language>("English");
  const [extraNotes, setExtraNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toBase64 = (f: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(f);
  });

  const generate = async () => {
    setError("");
    if (tab === "url" && !url.trim()) { setError("Please enter a URL."); return; }
    if (tab === "resume" && !file) { setError("Please upload a resume PDF."); return; }
    if (!jobTitle.trim()) { setError("Please enter the job title."); return; }

    setLoading(true); setResult("");
    try {
      const payload: Record<string, string> = {
        mode: tab,
        url: url.trim(),
        jobTitle, company, tone, platform, language, extraNotes,
      };
      if (tab === "resume") {
        payload.resumeBase64 = await toBase64(file!);
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data.message);
    } catch (e) { setError("Something went wrong: " + (e as Error).message); }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ minHeight: "100vh", background: s.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", paddingBottom: 60 }}>

        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 5%", borderBottom: `1px solid ${s.border}`, background: s.bg, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-.3px" }}>outreach.ai</div>
          <div style={{ background: s.text, color: s.bg, fontSize: ".72rem", fontWeight: 600, padding: ".25rem .75rem", borderRadius: 100 }}>AI-powered</div>
        </nav>

        <div style={{ textAlign: "center", padding: "3rem 5% 2rem", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: s.surface2, color: s.text2, fontSize: ".75rem", fontWeight: 500, padding: ".28rem .85rem", borderRadius: 100, marginBottom: "1.2rem", border: `1px solid ${s.border2}` }}>
            Built for recruiters
          </div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 700, letterSpacing: "-.8px", lineHeight: 1.2, marginBottom: ".75rem", color: s.text }}>
            Write better outreach<br />in seconds
          </h1>
          <p style={{ color: s.text2, fontSize: ".92rem", lineHeight: 1.6 }}>
            Generate personalized, human-sounding messages for candidates - no more copy-paste templates.
          </p>
        </div>

        <div className="layout" style={{ maxWidth: 1000, margin: "0 auto", padding: "0 5%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem", alignItems: "stretch" }}>

          <div style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: ".7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: s.muted, marginBottom: ".8rem" }}>Candidate Profile Source</div>

            <div style={{ display: "flex", gap: 8, marginBottom: "1.2rem" }}>
              <TabBtn active={tab === "url"} onClick={() => setTab("url")}>🔗 URL / Profile Link</TabBtn>
              <TabBtn active={tab === "resume"} onClick={() => setTab("resume")}>📄 Upload Resume (PDF)</TabBtn>
            </div>

            {tab === "url" ? (
              <Field label="Profile URL" hint="Supports GitHub, personal websites, open source pages, etc. (LinkedIn may have access limitations)">
                <input style={inputSt} placeholder="https://github.com/... or personal site" value={url} onChange={e => setUrl(e.target.value)} />
              </Field>
            ) : (
              <Field label="Resume PDF">
                <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${s.border2}`, borderRadius: 10, padding: 20, textAlign: "center", cursor: "pointer", background: s.surface2 }}>
                  {file ? (
                    <><div style={{ fontSize: 24 }}>📄</div><div style={{ fontWeight: 600, color: s.text, marginTop: 4 }}>{file.name}</div><div style={{ fontSize: 12, color: s.muted }}>{(file.size / 1024).toFixed(1)} KB</div></>
                  ) : (
                    <><div style={{ fontSize: 28 }}>⬆️</div><div style={{ color: s.text2, fontWeight: 600, marginTop: 4, fontSize: 14 }}>Click to upload PDF</div><div style={{ fontSize: 12, color: s.muted }}>PDF files only</div></>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </Field>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Job Title" required>
                <input style={inputSt} placeholder="e.g. Senior Backend Engineer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
              </Field>
              <Field label="Company Name">
                <input style={inputSt} placeholder="e.g. MeshyAI" value={company} onChange={e => setCompany(e.target.value)} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Tone">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {TONES.map(t => <Pill key={t} active={tone === t} onClick={() => setTone(t)}>{t}</Pill>)}
                </div>
              </Field>
              <Field label="Platform">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {PLATFORMS.map(p => <Pill key={p} active={platform === p} onClick={() => setPlatform(p)}>{p}</Pill>)}
                </div>
              </Field>
            </div>

            <Field label="Language">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {LANGUAGES.map(l => <Pill key={l} active={language === l} onClick={() => setLanguage(l)}>{l}</Pill>)}
              </div>
            </Field>

            <Field label="Additional Notes" optional>
              <textarea style={{ ...inputSt, minHeight: 68, resize: "vertical" }}
                placeholder="e.g. Mention remote-first culture, urgent hiring..."
                value={extraNotes} onChange={e => setExtraNotes(e.target.value)} />
            </Field>

            {error && <div style={{ background: "#fdf0f0", border: "1px solid #e8c8c8", borderRadius: 8, padding: "10px 14px", color: "#b94040", fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button onClick={generate} disabled={loading} style={{
              width: "100%", padding: 12, borderRadius: 9, border: "none", marginTop: "auto",
              background: loading ? s.border2 : s.text, color: loading ? s.muted : s.bg,
              fontWeight: 700, fontSize: ".95rem", fontFamily: "inherit",
              cursor: loading ? "not-allowed" : "pointer",
            }}>
              {loading ? "Generating..." : "Generate Message"}
            </button>
          </div>

          <div style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: ".7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: s.muted }}>Generated Message</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={generate} style={{ padding: "5px 14px", borderRadius: 8, border: `1.5px solid ${s.border2}`, background: s.surface2, color: s.text2, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>⟳ Regenerate</button>
                <button onClick={copy} style={{ padding: "5px 14px", borderRadius: 8, border: `1.5px solid ${s.text}`, background: s.text, color: s.bg, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
                  {copied ? "✅ Copied!" : "⎘ Copy"}
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 32, height: 32, border: `3px solid ${s.border2}`, borderTop: `3px solid ${s.text}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
              </div>
            ) : result ? (
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 14, lineHeight: 1.75, color: s.text, background: s.surface2, borderRadius: 8, padding: "1rem 1.1rem", border: `1px solid ${s.border}`, flex: 1 }}>
                {result}
              </pre>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: s.muted, fontStyle: "italic", fontSize: ".85rem", textAlign: "center", padding: "2rem" }}>
                Your generated message will appear here.<br />Fill in the details on the left and hit Generate.
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
