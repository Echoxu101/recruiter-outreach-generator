import { useState, useRef } from "react";

const TONES = ["Professional", "Friendly", "Casual", "Enthusiastic"];
const PLATFORMS = ["Email", "LinkedIn", "WhatsApp"];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div style={{width:36,height:36,border:"4px solid #e0e7ff",borderTop:"4px solid #6366f1",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 20px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        fontWeight: active ? 700 : 400,
        background: active ? "#6366f1" : "#f1f5f9",
        color: active ? "#fff" : "#64748b",
        transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState("url"); // "url" | "resume"
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [tone, setTone] = useState("Professional");
  const [platform, setPlatform] = useState("Email");
  const [extraNotes, setExtraNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();

  const toBase64 = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(f);
  });

  const buildPrompt = (profileInfo) => {
    return `You are an expert tech recruiter writing outreach messages.

Based on the following candidate profile information:
---
${profileInfo}
---

Write a ${tone.toLowerCase()} outreach message for ${platform} (${platform === "LinkedIn" ? "keep it under 300 characters for connection request, or a short InMail" : platform === "WhatsApp" ? "keep it concise and conversational" : "write a proper email with subject line"}).

Details:
- Role: ${jobTitle || "not specified"}
- Company: ${company || "not specified"}
- Tone: ${tone}
${extraNotes ? `- Additional notes: ${extraNotes}` : ""}

Requirements:
- Personalize the message based on specific details from the candidate's profile (skills, projects, experience, contributions).
- Be genuine and specific — avoid generic templates.
- Highlight why this candidate is a great fit.
- Include a clear call-to-action.
${platform === "Email" ? "- Start with: Subject: [subject line]\n\n[email body]" : ""}

Write only the message, nothing else.`;
  };

  const generate = async () => {
    setError("");
    setResult("");

    if (tab === "url" && !url.trim()) { setError("Please enter a URL."); return; }
    if (tab === "resume" && !file) { setError("Please upload a resume PDF."); return; }
    if (!jobTitle.trim()) { setError("Please enter the job title."); return; }

    setLoading(true);
    try {
      let messages;

      if (tab === "url") {
        // Use web search + Claude to analyze the URL
        const profilePrompt = `Analyze this profile/page: ${url.trim()}

Extract all relevant professional information including:
- Name, current role, company
- Skills and technologies
- Work experience and achievements
- Notable projects or contributions
- Education
- Any other relevant professional details

Then write a ${tone.toLowerCase()} ${platform} outreach message for the role of "${jobTitle}"${company ? ` at ${company}` : ""}.
${extraNotes ? `Additional recruiter notes: ${extraNotes}` : ""}

The message should:
- Be personalized with specific details from their profile
- Highlight why they're a great fit
- Have a clear call-to-action
${platform === "Email" ? "- Start with: Subject: [subject line]\n\nThen the email body." : platform === "LinkedIn" ? "- Be concise (under 300 chars for a connection note, or short InMail)" : "- Be conversational and brief"}

Write only the outreach message, nothing else.`;

        messages = [{ role: "user", content: profilePrompt }];

        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            tools: [{ type: "web_search_20250305", name: "web_search" }],
            messages,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const text = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
        setResult(text.trim());

      } else {
        // PDF resume
        const base64 = await toBase64(file);
        const prompt = buildPrompt("[See attached resume PDF]");
        messages = [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: prompt }
          ]
        }];

        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const text = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
        setResult(text.trim());
      }
    } catch (e) {
      setError("Something went wrong: " + e.message);
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0f4ff 0%,#faf5ff 100%)", padding: "32px 16px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✉️</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1e1b4b" }}>Recruiter Outreach Generator</h1>
          <p style={{ color: "#64748b", marginTop: 6 }}>Generate personalized outreach messages from resumes, LinkedIn, GitHub, or any profile URL.</p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(99,102,241,0.08)", padding: 28 }}>

          {/* Tab: Input Source */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Candidate Profile Source</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <TabBtn active={tab === "url"} onClick={() => setTab("url")}>🔗 URL / Profile Link</TabBtn>
              <TabBtn active={tab === "resume"} onClick={() => setTab("resume")}>📄 Upload Resume (PDF)</TabBtn>
            </div>
          </div>

          {tab === "url" ? (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Profile URL</label>
              <input
                style={inputStyle}
                placeholder="https://linkedin.com/in/... or https://github.com/... or personal site"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Supports LinkedIn, GitHub, personal websites, open source project pages, etc.</p>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Resume PDF</label>
              <div
                onClick={() => fileRef.current.click()}
                style={{
                  border: "2px dashed #c7d2fe", borderRadius: 10, padding: "20px 16px",
                  textAlign: "center", cursor: "pointer", background: "#f8f7ff",
                  transition: "border-color 0.2s",
                }}
              >
                {file ? (
                  <div>
                    <div style={{ fontSize: 24 }}>📄</div>
                    <div style={{ fontWeight: 600, color: "#6366f1", marginTop: 4 }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 32 }}>⬆️</div>
                    <div style={{ color: "#6366f1", fontWeight: 600, marginTop: 4 }}>Click to upload PDF</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>PDF files only</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
            </div>
          )}

          {/* Job Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Job Title <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={inputStyle} placeholder="e.g. Senior Backend Engineer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Company Name</label>
              <input style={inputStyle} placeholder="e.g. Stripe" value={company} onChange={e => setCompany(e.target.value)} />
            </div>
          </div>

          {/* Tone & Platform */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Tone</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{
                    padding: "5px 12px", borderRadius: 20, border: "1.5px solid",
                    borderColor: tone === t ? "#6366f1" : "#e2e8f0",
                    background: tone === t ? "#eef2ff" : "#fff",
                    color: tone === t ? "#6366f1" : "#64748b",
                    cursor: "pointer", fontSize: 13, fontWeight: tone === t ? 600 : 400,
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Platform</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => setPlatform(p)} style={{
                    padding: "5px 12px", borderRadius: 20, border: "1.5px solid",
                    borderColor: platform === p ? "#6366f1" : "#e2e8f0",
                    background: platform === p ? "#eef2ff" : "#fff",
                    color: platform === p ? "#6366f1" : "#64748b",
                    cursor: "pointer", fontSize: 13, fontWeight: platform === p ? 600 : 400,
                  }}>{p}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Extra Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Additional Notes <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
              placeholder="e.g. We're hiring urgently, mention remote-first culture, emphasize growth opportunity..."
              value={extraNotes}
              onChange={e => setExtraNotes(e.target.value)}
            />
          </div>

          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 14, marginBottom: 14 }}>{error}</div>}

          <button
            onClick={generate}
            disabled={loading}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
              background: loading ? "#a5b4fc" : "linear-gradient(90deg,#6366f1,#8b5cf6)",
              color: "#fff", fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 12px rgba(99,102,241,0.25)", transition: "opacity 0.2s",
            }}
          >
            {loading ? "Generating..." : "✨ Generate Message"}
          </button>
        </div>

        {/* Result */}
        {loading && <div style={{ marginTop: 20, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(99,102,241,0.08)", padding: 20 }}><Spinner /></div>}

        {result && !loading && (
          <div style={{ marginTop: 20, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(99,102,241,0.08)", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e1b4b" }}>📬 Your Outreach Message</h2>
              <button onClick={copy} style={{
                padding: "6px 16px", borderRadius: 8, border: "1.5px solid #c7d2fe",
                background: copied ? "#eef2ff" : "#fff", color: "#6366f1", cursor: "pointer", fontWeight: 600, fontSize: 13,
              }}>
                {copied ? "✅ Copied!" : "📋 Copy"}
              </button>
            </div>
            <pre style={{
              whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
              fontFamily: "system-ui,sans-serif", fontSize: 14.5, lineHeight: 1.7,
              color: "#334155", background: "#f8fafc", borderRadius: 10, padding: 18,
              border: "1px solid #e2e8f0",
            }}>{result}</pre>
            <button
              onClick={generate}
              style={{
                marginTop: 14, padding: "8px 20px", borderRadius: 8, border: "1.5px solid #c7d2fe",
                background: "#fff", color: "#6366f1", cursor: "pointer", fontWeight: 600, fontSize: 13,
              }}
            >🔄 Regenerate</button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0",
  fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "system-ui,sans-serif",
  marginTop: 5, color: "#1e293b", background: "#fafafa",
};
const labelStyle = { fontSize: 13, fontWeight: 600, color: "#374151" };
