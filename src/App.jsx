import { useState, useEffect } from "react";
import { ClipboardCheck, Download, RotateCcw, ChevronDown, ChevronUp, Zap, Wind, Fuel, Flame, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const INITIAL_STATE = {
  meta: {
    tanggal: new Date().toISOString().split("T")[0],
    waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    shift: "Pagi",
    petugas: "",
  },
  genset: [
    { id: 1, label: "Genset 1", status: "OFF", mode: "Auto", fuelLevel: "", levelOil: "H", engineTemp: "", engineCoolant: "", engineBaterai: "", runTime: "", kebocoranOli: "Tidak", catatan: "" },
    { id: 2, label: "Genset 2", status: "OFF", mode: "Auto", fuelLevel: "", levelOil: "H", engineTemp: "", engineCoolant: "", engineBaterai: "", runTime: "", kebocoranOli: "Tidak", catatan: "" },
    { id: 3, label: "Genset 3", status: "OFF", mode: "Auto", fuelLevel: "", levelOil: "H", engineTemp: "", engineCoolant: "", engineBaterai: "", runTime: "", kebocoranOli: "Tidak", catatan: "" },
  ],
  kwhPlnDc: "",
  cooling: [
    { id: 1, label: "PAC 1 (Dekat Pintu)", status: "OFF", suhuSupply: "", suhuReturn: "", suhuRuang: "", kelembaban: "", catatan: "" },
    { id: 2, label: "PAC 2 (Jauh Pintu)", status: "OFF", suhuSupply: "", suhuReturn: "", suhuRuang: "", kelembaban: "", catatan: "" },
    { id: 3, label: "PAC 3", status: "OFF", suhuSupply: "", suhuReturn: "", suhuRuang: "", kelembaban: "", catatan: "" },
  ],
  ups: [
    { id: 1, label: "UPS A", status: "Online", efisiensiBaterai: "", load: "", estimasiBackup: "", catatan: "" },
    { id: 2, label: "UPS B", status: "Off", efisiensiBaterai: "", load: "", estimasiBackup: "", catatan: "" },
  ],
  fss: {
    status: "normal",
    catatan: "",
  },
  catatanUmum: "",
};

const SHIFT_OPTIONS = ["Pagi", "Sore"];

function StatusBadge({ status }) {
  const colors = {
    ON: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
    OFF: { bg: "#f5f5f5", color: "#757575", border: "#bdbdbd" },
    Online: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
    Bypass: { bg: "#fff8e1", color: "#f57f17", border: "#ffe082" },
    Battery: { bg: "#fff8e1", color: "#f57f17", border: "#ffe082" },
    Off: { bg: "#f5f5f5", color: "#757575", border: "#bdbdbd" },
    Normal: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
    "Semua Normal": { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
    "Ada Anomali": { bg: "#ffebee", color: "#c62828", border: "#ef9a9a" },
  };
  const c = colors[status] || colors.OFF;
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, padding: "2px 10px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
      {status}
    </span>
  );
}

function Field({ label, unit, value, onChange, type = "number", placeholder, style, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, ...style }}>
      <label style={{ fontSize: 12, color: "#546e7a", fontWeight: 500 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "—"}
          style={{
            width: "100%", padding: "7px 10px", border: "1px solid #cfd8dc",
            borderRadius: 6, fontSize: 14, outline: "none", background: "#fafafa",
            transition: "border 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#1976d2")}
          onBlur={(e) => (e.target.style.borderColor = "#cfd8dc")}
        />
        {unit && <span style={{ fontSize: 12, color: "#90a4ae", whiteSpace: "nowrap" }}>{unit}</span>}
      </div>
      {hint && <span style={{ fontSize: 10, color: "#b0bec5", lineHeight: 1.2 }}>{hint}</span>}
    </div>
  );
}

function Select({ label, value, onChange, options, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontSize: 12, color: "#546e7a", fontWeight: 500 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "7px 10px", border: "1px solid #cfd8dc", borderRadius: 6,
          fontSize: 14, background: "#fafafa", outline: "none", cursor: "pointer",
        }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {hint && <span style={{ fontSize: 10, color: "#b0bec5", lineHeight: 1.2 }}>{hint}</span>}
    </div>
  );
}

function Section({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "12px 16px", border: "none", background: open ? "#f5f7fa" : "#fff",
          cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#263238",
        }}
      >
        {icon}
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div style={{ padding: "12px 16px 16px" }}>{children}</div>}
    </div>
  );
}

/* ============ PRINT VIEW ============ */
function PrintView({ data }) {
  const now = new Date();
  const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 16px", marginTop: 8 };
  const cellLabel = { fontSize: 11, color: "#78909c" };
  const cellValue = { fontSize: 13, fontWeight: 600, color: "#263238" };

  return (
    <div id="print-area" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#263238", maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 16, borderBottom: "2px solid #1565c0", paddingBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#546e7a", letterSpacing: 1, marginBottom: 2 }}>OTORITA IBU KOTA NUSANTARA</div>
        <div style={{ fontSize: 11, color: "#546e7a", marginBottom: 4 }}>Direktorat Data dan Kecerdasan Buatan — Tim Pusat Data Tepi</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1565c0" }}>Logsheet Monitoring Harian</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16, background: "#f5f7fa", padding: 10, borderRadius: 6, fontSize: 13 }}>
        <div><span style={cellLabel}>Tanggal: </span><strong>{data.meta.tanggal}</strong></div>
        <div><span style={cellLabel}>Waktu: </span><strong>{data.meta.waktu}</strong></div>
        <div><span style={cellLabel}>Shift: </span><strong>{data.meta.shift}</strong></div>
        <div><span style={cellLabel}>Petugas: </span><strong>{data.meta.petugas || "—"}</strong></div>
      </div>

      {/* GENSET */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1565c0", borderBottom: "1px solid #e0e0e0", paddingBottom: 4, marginBottom: 6 }}>A. Pengecekan Genset</div>
        {data.genset.map((g) => (
          <div key={g.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{g.label}</div>
            <div style={gridStyle}>
              <div><span style={cellLabel}>Status</span><br /><StatusBadge status={g.status} /></div>
              <div><span style={cellLabel}>Mode</span><br /><span style={cellValue}>{g.mode}</span></div>
              <div><span style={cellLabel}>Fuel</span><br /><span style={cellValue}>{g.fuelLevel || "—"} %</span></div>
              <div><span style={cellLabel}>Level Oil</span><br /><span style={cellValue}>{g.levelOil}</span></div>
              <div><span style={cellLabel}>Engine Temp</span><br /><span style={cellValue}>{g.engineTemp || "—"} °C</span></div>
              <div><span style={cellLabel}>Engine Coolant</span><br /><span style={cellValue}>{g.engineCoolant || "—"} °C</span></div>
              <div><span style={cellLabel}>Engine Baterai</span><br /><span style={cellValue}>{g.engineBaterai || "—"} V</span></div>
              <div><span style={cellLabel}>Run Time</span><br /><span style={cellValue}>{g.runTime || "—"} h</span></div>
              <div><span style={cellLabel}>Kebocoran Oli/Solar</span><br /><StatusBadge status={g.kebocoranOli === "Ada" ? "Ada Anomali" : "Normal"} /></div>
            </div>
            {g.catatan && <div style={{ fontSize: 12, marginTop: 2, color: "#546e7a" }}>Catatan: {g.catatan}</div>}
          </div>
        ))}
        <div style={{ marginTop: 6, fontSize: 13 }}><span style={cellLabel}>kWh PLN DC: </span><span style={cellValue}>{data.kwhPlnDc || "—"} kWh</span></div>
      </div>

      {/* COOLING */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1565c0", borderBottom: "1px solid #e0e0e0", paddingBottom: 4, marginBottom: 6 }}>B. Pengecekan Cooling</div>
        {data.cooling.map((c) => (
          <div key={c.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
            <div style={gridStyle}>
              <div><span style={cellLabel}>Status</span><br /><StatusBadge status={c.status} /></div>
              <div><span style={cellLabel}>Suhu Supply Air (Masuk)</span><br /><span style={cellValue}>{c.suhuSupply || "—"} °C</span></div>
              <div><span style={cellLabel}>Suhu Return Air (Keluar)</span><br /><span style={cellValue}>{c.suhuReturn || "—"} °C</span></div>
              <div><span style={cellLabel}>Suhu Ruang Server</span><br /><span style={cellValue}>{c.suhuRuang || "—"} °C</span></div>
              <div><span style={cellLabel}>Kelembaban</span><br /><span style={cellValue}>{c.kelembaban || "—"} %</span></div>
            </div>
            {c.catatan && <div style={{ fontSize: 12, marginTop: 2, color: "#546e7a" }}>Catatan: {c.catatan}</div>}
          </div>
        ))}
      </div>

      {/* UPS */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1565c0", borderBottom: "1px solid #e0e0e0", paddingBottom: 4, marginBottom: 6 }}>C. Pengecekan UPS</div>
        {data.ups.map((u) => (
          <div key={u.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{u.label}</div>
            <div style={gridStyle}>
              <div><span style={cellLabel}>Status</span><br /><StatusBadge status={u.status} /></div>
              <div><span style={cellLabel}>Efisiensi Baterai</span><br /><span style={cellValue}>{u.efisiensiBaterai || "—"} %</span></div>
              <div><span style={cellLabel}>Load</span><br /><span style={cellValue}>{u.load || "—"} KVA</span></div>
              <div><span style={cellLabel}>Estimasi Backup</span><br /><span style={cellValue}>{u.estimasiBackup || "—"} menit</span></div>
            </div>
            {u.catatan && <div style={{ fontSize: 12, marginTop: 2, color: "#546e7a" }}>Catatan: {u.catatan}</div>}
          </div>
        ))}
      </div>

      {/* FSS */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1565c0", borderBottom: "1px solid #e0e0e0", paddingBottom: 4, marginBottom: 6 }}>D. Fire Suppression System (FSS)</div>
        <div style={{ marginTop: 8 }}>
          <span style={cellLabel}>Status: </span>
          <StatusBadge status={data.fss.status === "normal" ? "Semua Normal" : "Ada Anomali"} />
        </div>
        {data.fss.status === "anomali" && data.fss.catatan && (
          <div style={{ fontSize: 12, marginTop: 6, color: "#c62828", background: "#ffebee", padding: "6px 10px", borderRadius: 4, borderLeft: "3px solid #c62828" }}>
            <strong>Detail Anomali:</strong> {data.fss.catatan}
          </div>
        )}
      </div>

      {data.catatanUmum && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1565c0", borderBottom: "1px solid #e0e0e0", paddingBottom: 4, marginBottom: 6 }}>Catatan Umum</div>
          <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{data.catatanUmum}</div>
        </div>
      )}

      <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 10, marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#90a4ae" }}>
        <span>Generated: {now.toLocaleString("id-ID")}</span>
        <span>Pusat Data Tepi — OIKN</span>
      </div>
    </div>
  );
}

/* ============ MAIN APP ============ */
export default function DCLogsheet() {
  const [data, setData] = useState(INITIAL_STATE);
  const [view, setView] = useState("form");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("logsheet-draft-v2");
      if (raw) {
        const parsed = JSON.parse(raw);
        setData(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem("logsheet-draft-v2", JSON.stringify(data)); } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [data]);

  const updateMeta = (k, v) => setData((d) => ({ ...d, meta: { ...d.meta, [k]: v } }));
  const updateGenset = (i, k, v) => setData((d) => { const g = [...d.genset]; g[i] = { ...g[i], [k]: v }; return { ...d, genset: g }; });
  const updateCooling = (i, k, v) => setData((d) => { const c = [...d.cooling]; c[i] = { ...c[i], [k]: v }; return { ...d, cooling: c }; });
  const updateUPS = (i, k, v) => setData((d) => { const u = [...d.ups]; u[i] = { ...u[i], [k]: v }; return { ...d, ups: u }; });
  const updateFSS = (k, v) => setData((d) => ({ ...d, fss: { ...d.fss, [k]: v } }));

  const handleReset = () => {
    if (confirm("Reset semua isian?")) {
      setData(INITIAL_STATE);
      try { localStorage.removeItem("logsheet-draft-v2"); } catch {}
    }
  };

  const handleExport = () => {
    if (data.fss.status === "anomali" && !data.fss.catatan.trim()) {
      alert("FSS ada anomali tapi catatan belum diisi.");
      return;
    }
    if (!data.meta.petugas) {
      alert("Nama petugas piket belum diisi.");
      return;
    }
    setView("preview");
    setTimeout(() => window.print(), 400);
  };

  const handleSave = () => {
    const key = `logsheet:${data.meta.tanggal}-${data.meta.shift}-${Date.now()}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { alert("Gagal menyimpan."); }
  };

  const printCSS = `@media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; } }`;

  const containerStyle = {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    maxWidth: 640, margin: "0 auto", padding: "12px 16px 80px",
    color: "#263238", minHeight: "100vh", background: "#f0f2f5",
  };

  if (view === "preview") {
    return (
      <div style={containerStyle}>
        <style>{printCSS}</style>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setView("form")} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cfd8dc", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Kembali</button>
          <button onClick={() => window.print()} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1565c0", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            <Download size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Save as PDF
          </button>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <PrintView data={data} />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{printCSS}</style>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#78909c", letterSpacing: 0.5 }}>Pusat Data Tepi — OIKN</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1565c0", margin: "4px 0" }}>
          <ClipboardCheck size={20} style={{ verticalAlign: -3, marginRight: 6 }} />
          Logsheet Monitoring DC
        </h1>
        <div style={{ fontSize: 12, color: "#90a4ae" }}>Isi data monitoring, lalu export PDF untuk dikirim ke grup.</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* META */}
        <Section title="Info Shift" icon={<Clock size={16} color="#1565c0" />}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Tanggal" type="date" value={data.meta.tanggal} onChange={(v) => updateMeta("tanggal", v)} />
            <Field label="Waktu" type="time" value={data.meta.waktu} onChange={(v) => updateMeta("waktu", v)} />
            <Select label="Shift" value={data.meta.shift} onChange={(v) => updateMeta("shift", v)} options={SHIFT_OPTIONS} />
            <Field label="Petugas Piket" type="text" value={data.meta.petugas} onChange={(v) => updateMeta("petugas", v)} placeholder="Nama petugas" />
          </div>
        </Section>

        {/* A. GENSET */}
        <Section title="A. Pengecekan Genset" icon={<Fuel size={16} color="#e65100" />}>
          {data.genset.map((g, i) => (
            <div key={g.id} style={{ marginBottom: i < data.genset.length - 1 ? 16 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#37474f" }}>{g.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Select label="Status Genset" value={g.status} onChange={(v) => updateGenset(i, "status", v)} options={["ON", "OFF"]} />
                <Select label="Mode Genset" value={g.mode} onChange={(v) => updateGenset(i, "mode", v)} options={["Auto", "Manual"]} hint="Standar: Auto" />
                <Field label="Fuel Genset" unit="%" value={g.fuelLevel} onChange={(v) => updateGenset(i, "fuelLevel", v)} hint="> 50%; isi ulang < 25%" />
                <Select label="Level Oil" value={g.levelOil} onChange={(v) => updateGenset(i, "levelOil", v)} options={["L", "M", "H"]} hint="L (Low) / M (Medium) / H (High)" />
                <Field label="Engine Temp" unit="°C" value={g.engineTemp} onChange={(v) => updateGenset(i, "engineTemp", v)} hint="70–90°C normal; maks 105°C" />
                <Field label="Engine Coolant" unit="°C" value={g.engineCoolant} onChange={(v) => updateGenset(i, "engineCoolant", v)} hint="Level normal; tidak ada kebocoran" />
                <Field label="Engine Baterai" unit="V" value={g.engineBaterai} onChange={(v) => updateGenset(i, "engineBaterai", v)} hint="Tegangan aki ≥ 12.5V" />
                <Field label="Engine Run Time" unit="h" value={g.runTime} onChange={(v) => updateGenset(i, "runTime", v)} hint="Maintenance per 250–500 jam" />
                <Select label="Kebocoran Oli/Solar" value={g.kebocoranOli} onChange={(v) => updateGenset(i, "kebocoranOli", v)} options={["Tidak", "Ada"]} hint="Ada = tindakan segera" />
              </div>
              <div style={{ marginTop: 6 }}>
                <Field label="Catatan" type="text" value={g.catatan} onChange={(v) => updateGenset(i, "catatan", v)} placeholder="Opsional" />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e0e0e0" }}>
            <Field label="kWh PLN DC" unit="kWh" value={data.kwhPlnDc} onChange={(v) => setData((d) => ({ ...d, kwhPlnDc: v }))} hint="Tercatat per shift; anomali = investigasi" />
          </div>
        </Section>

        {/* B. COOLING */}
        <Section title="B. Pengecekan Cooling" icon={<Wind size={16} color="#0097a7" />}>
          {data.cooling.map((c, i) => (
            <div key={c.id} style={{ marginBottom: i < data.cooling.length - 1 ? 16 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#37474f" }}>{c.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Select label="Status Unit Cooling" value={c.status} onChange={(v) => updateCooling(i, "status", v)} options={["ON", "OFF"]} hint="Salah satu harus ON" />
                <Field label="Suhu Supply Air (Masuk)" unit="°C" value={c.suhuSupply} onChange={(v) => updateCooling(i, "suhuSupply", v)} hint="Standar: 16°C – 20°C" />
                <Field label="Suhu Return Air (Keluar)" unit="°C" value={c.suhuReturn} onChange={(v) => updateCooling(i, "suhuReturn", v)} hint="Standar: 22°C – 26°C" />
                <Field label="Suhu Ruang Server" unit="°C" value={c.suhuRuang} onChange={(v) => updateCooling(i, "suhuRuang", v)} hint="Standar: < 27°C" />
                <Field label="Kelembaban Ruang Server" unit="%" value={c.kelembaban} onChange={(v) => updateCooling(i, "kelembaban", v)} hint="Standar: 40% – 80% RH" />
              </div>
              <div style={{ marginTop: 6 }}>
                <Field label="Catatan" type="text" value={c.catatan} onChange={(v) => updateCooling(i, "catatan", v)} placeholder="Opsional" />
              </div>
            </div>
          ))}
        </Section>

        {/* C. UPS */}
        <Section title="C. Pengecekan UPS" icon={<Zap size={16} color="#f9a825" />}>
          {data.ups.map((u, i) => (
            <div key={u.id} style={{ marginBottom: i < data.ups.length - 1 ? 16 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#37474f" }}>{u.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Select label="Status UPS" value={u.status} onChange={(v) => updateUPS(i, "status", v)} options={["Online", "Bypass", "Battery", "Off"]} hint="Standar: Online (bukan Bypass/Battery)" />
                <Field label="Efisiensi Baterai" unit="%" value={u.efisiensiBaterai} onChange={(v) => updateUPS(i, "efisiensiBaterai", v)} hint="Standar: ≥ 90%" />
                <Field label="Load" unit="KVA" value={u.load} onChange={(v) => updateUPS(i, "load", v)} hint="Standar: < 110 KVA" />
                <Field label="Estimasi Backup" unit="menit" value={u.estimasiBackup} onChange={(v) => updateUPS(i, "estimasiBackup", v)} hint="Standar: > 10 menit" />
              </div>
              <div style={{ marginTop: 6 }}>
                <Field label="Catatan" type="text" value={u.catatan} onChange={(v) => updateUPS(i, "catatan", v)} placeholder="Opsional" />
              </div>
            </div>
          ))}
        </Section>

        {/* D. FSS */}
        <Section title="D. Fire Suppression System (FSS)" icon={<Flame size={16} color="#d32f2f" />}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[
              { val: "normal", label: "Semua Normal", icon: <CheckCircle size={16} />, bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
              { val: "anomali", label: "Ada Anomali", icon: <AlertTriangle size={16} />, bg: "#ffebee", color: "#c62828", border: "#ef9a9a" },
            ].map((opt) => {
              const active = data.fss.status === opt.val;
              return (
                <button
                  key={opt.val}
                  onClick={() => { updateFSS("status", opt.val); if (opt.val === "normal") updateFSS("catatan", ""); }}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "12px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600,
                    border: `2px solid ${active ? opt.border : "#e0e0e0"}`,
                    background: active ? opt.bg : "#fff",
                    color: active ? opt.color : "#90a4ae",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.icon} {opt.label}
                </button>
              );
            })}
          </div>
          {data.fss.status === "anomali" && (
            <div>
              <label style={{ fontSize: 12, color: "#c62828", fontWeight: 600 }}>Detail Anomali <span>*wajib diisi</span></label>
              <textarea
                value={data.fss.catatan}
                onChange={(e) => updateFSS("catatan", e.target.value)}
                placeholder="Jelaskan anomali: komponen mana, kondisi apa, tindakan yang sudah dilakukan..."
                rows={3}
                style={{
                  width: "100%", padding: 10, marginTop: 4,
                  border: `1.5px solid ${!data.fss.catatan.trim() ? "#ef9a9a" : "#cfd8dc"}`,
                  borderRadius: 6, fontSize: 14, fontFamily: "inherit", resize: "vertical",
                  outline: "none", background: !data.fss.catatan.trim() ? "#fff5f5" : "#fafafa",
                  boxSizing: "border-box",
                }}
              />
              {!data.fss.catatan.trim() && <span style={{ fontSize: 11, color: "#c62828" }}>Catatan wajib diisi jika ada anomali pada FSS.</span>}
            </div>
          )}
        </Section>

        {/* CATATAN UMUM */}
        <Section title="Catatan Umum / Temuan" icon={<AlertTriangle size={16} color="#546e7a" />} defaultOpen={false}>
          <textarea
            value={data.catatanUmum}
            onChange={(e) => setData((d) => ({ ...d, catatanUmum: e.target.value }))}
            placeholder="Catatan tambahan, temuan, atau anomali..."
            rows={4}
            style={{
              width: "100%", padding: 10, border: "1px solid #cfd8dc", borderRadius: 6,
              fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none",
              background: "#fafafa", boxSizing: "border-box",
            }}
          />
        </Section>
      </div>

      {/* Bottom Actions */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: "1px solid #e0e0e0",
        padding: "10px 16px", display: "flex", gap: 8, justifyContent: "center", zIndex: 100,
      }}>
        <button onClick={handleReset} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #ef9a9a", background: "#fff", color: "#c62828", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          <RotateCcw size={14} /> Reset
        </button>
        <button onClick={handleSave} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #a5d6a7", background: saved ? "#e8f5e9" : "#fff", color: "#2e7d32", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, transition: "background 0.2s" }}>
          <CheckCircle size={14} /> {saved ? "Tersimpan!" : "Simpan"}
        </button>
        <button onClick={() => setView("preview")} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #90caf9", background: "#fff", color: "#1565c0", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          Preview
        </button>
        <button onClick={handleExport} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#1565c0", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 8px rgba(21,101,194,0.3)" }}>
          <Download size={14} /> Export PDF
        </button>
      </div>
    </div>
  );
}
