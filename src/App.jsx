import { useState, useEffect, useRef } from "react";
import { ClipboardCheck, Download, RotateCcw, ChevronDown, ChevronUp, Zap, Wind, Fuel, Flame, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const INITIAL_STATE = {
  meta: {
    tanggal: new Date().toISOString().split("T")[0],
    waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    shift: "Pagi",
    petugas: "",
  },
  ups: [
    { id: 1, label: "UPS A", inputVoltage: "", outputVoltage: "", batteryLevel: "", loadPercent: "", temperature: "", status: "Normal", catatan: "" },
    { id: 2, label: "UPS B", inputVoltage: "", outputVoltage: "", batteryLevel: "", loadPercent: "", temperature: "", status: "Normal", catatan: "" },
  ],
  ac: [
    { id: 1, label: "AC 1 (Precision)", suhuSetting: "", suhuAktual: "", humidity: "", status: "Normal", catatan: "" },
    { id: 2, label: "AC 2 (Precision)", suhuSetting: "", suhuAktual: "", humidity: "", status: "Normal", catatan: "" },
    { id: 3, label: "AC 3 (Precision)", suhuSetting: "", suhuAktual: "", humidity: "", status: "Normal", catatan: "" },
  ],
  genset: [
    { id: 1, label: "Genset DC 01", fuelLevel: "", batteryVoltage: "", runningHours: "", oilPressure: "", coolantTemp: "", status: "Standby", catatan: "" },
    { id: 2, label: "Genset DC 02", fuelLevel: "", batteryVoltage: "", runningHours: "", oilPressure: "", coolantTemp: "", status: "Standby", catatan: "" },
    { id: 3, label: "Genset DC 03", fuelLevel: "", batteryVoltage: "", runningHours: "", oilPressure: "", coolantTemp: "", status: "Standby", catatan: "" },
  ],
  fss: {
    status: "normal", // "normal" | "anomali"
    catatan: "",
  },
  catatanUmum: "",
};

const STATUS_OPTIONS = ["Normal", "Warning", "Critical"];
const GENSET_STATUS = ["Standby", "Running", "Maintenance", "Off"];
const SHIFT_OPTIONS = ["Pagi", "Sore"];
const STAFF = ["Ishmat", "Ajeng", "Ershad", "Revani", "Julda", "Rinaldi"];

function StatusBadge({ status }) {
  const colors = {
    Normal: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
    "Semua Normal": { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
    "Ada Anomali": { bg: "#ffebee", color: "#c62828", border: "#ef9a9a" },
    Standby: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
    Warning: { bg: "#fff8e1", color: "#f57f17", border: "#ffe082" },
    Critical: { bg: "#ffebee", color: "#c62828", border: "#ef9a9a" },
    Running: { bg: "#e3f2fd", color: "#1565c0", border: "#90caf9" },
    Maintenance: { bg: "#fff8e1", color: "#f57f17", border: "#ffe082" },
    Off: { bg: "#f5f5f5", color: "#757575", border: "#bdbdbd" },
  };
  const c = colors[status] || colors.Normal;
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, padding: "2px 10px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
      {status}
    </span>
  );
}

function Field({ label, unit, value, onChange, type = "number", placeholder, style }) {
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
    </div>
  );
}

function Select({ label, value, onChange, options }) {
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

      {/* UPS */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1565c0", borderBottom: "1px solid #e0e0e0", paddingBottom: 4, marginBottom: 6 }}>⚡ UPS</div>
        {data.ups.map((ups) => (
          <div key={ups.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{ups.label}</div>
            <div style={{ ...gridStyle, marginTop: 2 }}>
              <div><span style={cellLabel}>Input Voltage</span><br /><span style={cellValue}>{ups.inputVoltage || "—"} V</span></div>
              <div><span style={cellLabel}>Output Voltage</span><br /><span style={cellValue}>{ups.outputVoltage || "—"} V</span></div>
              <div><span style={cellLabel}>Battery Level</span><br /><span style={cellValue}>{ups.batteryLevel || "—"} %</span></div>
              <div><span style={cellLabel}>Load</span><br /><span style={cellValue}>{ups.loadPercent || "—"} %</span></div>
              <div><span style={cellLabel}>Suhu UPS</span><br /><span style={cellValue}>{ups.temperature || "—"} °C</span></div>
              <div><span style={cellLabel}>Status</span><br /><StatusBadge status={ups.status} /></div>
            </div>
            {ups.catatan && <div style={{ fontSize: 12, marginTop: 2, color: "#546e7a" }}>Catatan: {ups.catatan}</div>}
          </div>
        ))}
      </div>

      {/* AC */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1565c0", borderBottom: "1px solid #e0e0e0", paddingBottom: 4, marginBottom: 6 }}>❄️ Pendingin (AC)</div>
        {data.ac.map((ac) => (
          <div key={ac.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{ac.label}</div>
            <div style={{ ...gridStyle, marginTop: 2 }}>
              <div><span style={cellLabel}>Setting</span><br /><span style={cellValue}>{ac.suhuSetting || "—"} °C</span></div>
              <div><span style={cellLabel}>Suhu Aktual</span><br /><span style={cellValue}>{ac.suhuAktual || "—"} °C</span></div>
              <div><span style={cellLabel}>Humidity</span><br /><span style={cellValue}>{ac.humidity || "—"} %</span></div>
              <div><span style={cellLabel}>Status</span><br /><StatusBadge status={ac.status} /></div>
            </div>
            {ac.catatan && <div style={{ fontSize: 12, marginTop: 2, color: "#546e7a" }}>Catatan: {ac.catatan}</div>}
          </div>
        ))}
      </div>

      {/* Genset */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1565c0", borderBottom: "1px solid #e0e0e0", paddingBottom: 4, marginBottom: 6 }}>⛽ Genset</div>
        {data.genset.map((g) => (
          <div key={g.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{g.label}</div>
            <div style={{ ...gridStyle, marginTop: 2 }}>
              <div><span style={cellLabel}>Fuel Level</span><br /><span style={cellValue}>{g.fuelLevel || "—"} %</span></div>
              <div><span style={cellLabel}>Batt. Voltage</span><br /><span style={cellValue}>{g.batteryVoltage || "—"} V</span></div>
              <div><span style={cellLabel}>Running Hours</span><br /><span style={cellValue}>{g.runningHours || "—"} h</span></div>
              <div><span style={cellLabel}>Oil Pressure</span><br /><span style={cellValue}>{g.oilPressure || "—"} psi</span></div>
              <div><span style={cellLabel}>Coolant Temp</span><br /><span style={cellValue}>{g.coolantTemp || "—"} °C</span></div>
              <div><span style={cellLabel}>Status</span><br /><StatusBadge status={g.status} /></div>
            </div>
            {g.catatan && <div style={{ fontSize: 12, marginTop: 2, color: "#546e7a" }}>Catatan: {g.catatan}</div>}
          </div>
        ))}
      </div>

      {/* FSS */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1565c0", borderBottom: "1px solid #e0e0e0", paddingBottom: 4, marginBottom: 6 }}>🔥 Fire Suppression System (FSS)</div>
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
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1565c0", borderBottom: "1px solid #e0e0e0", paddingBottom: 4, marginBottom: 6 }}>📝 Catatan Umum</div>
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

export default function DCLogsheet() {
  const [data, setData] = useState(INITIAL_STATE);
  const [view, setView] = useState("form"); // form | preview
  const [saved, setSaved] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("logsheet-draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migrate: if saved UPS is single object (not array), convert to array
        if (parsed.ups && !Array.isArray(parsed.ups)) {
          parsed.ups = [
            { id: 1, label: "UPS A", ...parsed.ups },
            { ...INITIAL_STATE.ups[1] },
          ];
        }
        // Migrate: if saved draft has fewer ACs than current template, pad with defaults
        if (parsed.ac && parsed.ac.length < INITIAL_STATE.ac.length) {
          for (let i = parsed.ac.length; i < INITIAL_STATE.ac.length; i++) {
            parsed.ac.push({ ...INITIAL_STATE.ac[i] });
          }
        }
        // Migrate: if old FSS format (has tekananTabung), reset to new format
        if (parsed.fss && ("tekananTabung" in parsed.fss || "statusAlarm" in parsed.fss)) {
          parsed.fss = { ...INITIAL_STATE.fss };
        }
        setData(parsed);
      }
    } catch { /* no saved draft */ }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("logsheet-draft", JSON.stringify(data));
      } catch { /* storage unavailable */ }
    }, 1000);
    return () => clearTimeout(timer);
  }, [data]);

  const updateMeta = (key, val) => setData((d) => ({ ...d, meta: { ...d.meta, [key]: val } }));
  const updateUPS = (idx, key, val) => setData((d) => {
    const ups = [...d.ups];
    ups[idx] = { ...ups[idx], [key]: val };
    return { ...d, ups };
  });
  const updateAC = (idx, key, val) => setData((d) => {
    const ac = [...d.ac];
    ac[idx] = { ...ac[idx], [key]: val };
    return { ...d, ac };
  });
  const updateGenset = (idx, key, val) => setData((d) => {
    const genset = [...d.genset];
    genset[idx] = { ...genset[idx], [key]: val };
    return { ...d, genset };
  });
  const updateFSS = (key, val) => setData((d) => ({ ...d, fss: { ...d.fss, [key]: val } }));

  const handleReset = () => {
    if (confirm("Reset semua isian?")) {
      setData(INITIAL_STATE);
      try { localStorage.removeItem("logsheet-draft"); } catch {}
    }
  };

  const handleExport = () => {
    if (data.fss.status === "anomali" && !data.fss.catatan.trim()) {
      alert("FSS ada anomali tapi catatan belum diisi. Isi dulu detail anomali sebelum export.");
      return;
    }
    if (!data.meta.petugas) {
      alert("Nama petugas piket belum dipilih.");
      return;
    }
    setView("preview");
    setTimeout(() => window.print(), 400);
  };

  // Save history entry
  const handleSave = () => {
    const key = `logsheet:${data.meta.tanggal}-${data.meta.shift}-${Date.now()}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { alert("Gagal menyimpan."); }
  };

  const containerStyle = {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    maxWidth: 640,
    margin: "0 auto",
    padding: "12px 16px 80px",
    color: "#263238",
    minHeight: "100vh",
    background: "#f0f2f5",
  };

  // Print CSS
  const printCSS = `
    @media print {
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
    }
  `;

  if (view === "preview") {
    return (
      <div style={containerStyle}>
        <style>{printCSS}</style>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }} className="no-print">
          <button onClick={() => setView("form")} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cfd8dc", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            ← Kembali ke Form
          </button>
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

      {/* Header */}
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

        {/* UPS */}
        <Section title="UPS" icon={<Zap size={16} color="#f9a825" />}>
          {data.ups.map((ups, i) => (
            <div key={ups.id} style={{ marginBottom: i < data.ups.length - 1 ? 14 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#37474f" }}>{ups.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Input Voltage" unit="V" value={ups.inputVoltage} onChange={(v) => updateUPS(i, "inputVoltage", v)} />
                <Field label="Output Voltage" unit="V" value={ups.outputVoltage} onChange={(v) => updateUPS(i, "outputVoltage", v)} />
                <Field label="Battery Level" unit="%" value={ups.batteryLevel} onChange={(v) => updateUPS(i, "batteryLevel", v)} />
                <Field label="Load" unit="%" value={ups.loadPercent} onChange={(v) => updateUPS(i, "loadPercent", v)} />
                <Field label="Suhu UPS" unit="°C" value={ups.temperature} onChange={(v) => updateUPS(i, "temperature", v)} />
                <Select label="Status" value={ups.status} onChange={(v) => updateUPS(i, "status", v)} options={STATUS_OPTIONS} />
              </div>
              <div style={{ marginTop: 6 }}>
                <Field label="Catatan" type="text" value={ups.catatan} onChange={(v) => updateUPS(i, "catatan", v)} placeholder="Opsional" />
              </div>
            </div>
          ))}
        </Section>

        {/* AC */}
        <Section title="Pendingin (AC)" icon={<Wind size={16} color="#0097a7" />}>
          {data.ac.map((ac, i) => (
            <div key={ac.id} style={{ marginBottom: i < data.ac.length - 1 ? 14 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#37474f" }}>{ac.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Suhu Setting" unit="°C" value={ac.suhuSetting} onChange={(v) => updateAC(i, "suhuSetting", v)} />
                <Field label="Suhu Aktual" unit="°C" value={ac.suhuAktual} onChange={(v) => updateAC(i, "suhuAktual", v)} />
                <Field label="Humidity" unit="%" value={ac.humidity} onChange={(v) => updateAC(i, "humidity", v)} />
                <Select label="Status" value={ac.status} onChange={(v) => updateAC(i, "status", v)} options={STATUS_OPTIONS} />
              </div>
              <div style={{ marginTop: 6 }}>
                <Field label="Catatan" type="text" value={ac.catatan} onChange={(v) => updateAC(i, "catatan", v)} placeholder="Opsional" />
              </div>
            </div>
          ))}
        </Section>

        {/* GENSET */}
        <Section title="Genset" icon={<Fuel size={16} color="#e65100" />}>
          {data.genset.map((g, i) => (
            <div key={g.id} style={{ marginBottom: i < data.genset.length - 1 ? 14 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#37474f" }}>{g.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Fuel Level" unit="%" value={g.fuelLevel} onChange={(v) => updateGenset(i, "fuelLevel", v)} />
                <Field label="Battery Voltage" unit="V" value={g.batteryVoltage} onChange={(v) => updateGenset(i, "batteryVoltage", v)} />
                <Field label="Running Hours" unit="h" value={g.runningHours} onChange={(v) => updateGenset(i, "runningHours", v)} />
                <Field label="Oil Pressure" unit="psi" value={g.oilPressure} onChange={(v) => updateGenset(i, "oilPressure", v)} />
                <Field label="Coolant Temp" unit="°C" value={g.coolantTemp} onChange={(v) => updateGenset(i, "coolantTemp", v)} />
                <Select label="Status" value={g.status} onChange={(v) => updateGenset(i, "status", v)} options={GENSET_STATUS} />
              </div>
              <div style={{ marginTop: 6 }}>
                <Field label="Catatan" type="text" value={g.catatan} onChange={(v) => updateGenset(i, "catatan", v)} placeholder="Opsional" />
              </div>
            </div>
          ))}
        </Section>

        {/* FSS */}
        <Section title="Fire Suppression System (FSS)" icon={<Flame size={16} color="#d32f2f" />}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[
              { val: "normal", label: "Semua Normal", icon: <CheckCircle size={16} />, bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
              { val: "anomali", label: "Ada Anomali", icon: <AlertTriangle size={16} />, bg: "#ffebee", color: "#c62828", border: "#ef9a9a" },
            ].map((opt) => {
              const active = data.fss.status === opt.val;
              return (
                <button
                  key={opt.val}
                  onClick={() => {
                    updateFSS("status", opt.val);
                    if (opt.val === "normal") updateFSS("catatan", "");
                  }}
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
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <label style={{ fontSize: 12, color: "#c62828", fontWeight: 600 }}>
                  Detail Anomali <span style={{ color: "#c62828" }}>*wajib diisi</span>
                </label>
                <textarea
                  value={data.fss.catatan}
                  onChange={(e) => updateFSS("catatan", e.target.value)}
                  placeholder="Jelaskan anomali: komponen mana, kondisi apa, tindakan yang sudah dilakukan..."
                  rows={3}
                  style={{
                    width: "100%", padding: 10,
                    border: `1.5px solid ${!data.fss.catatan.trim() ? "#ef9a9a" : "#cfd8dc"}`,
                    borderRadius: 6, fontSize: 14, fontFamily: "inherit", resize: "vertical",
                    outline: "none", background: !data.fss.catatan.trim() ? "#fff5f5" : "#fafafa",
                    boxSizing: "border-box", transition: "border 0.15s, background 0.15s",
                  }}
                />
                {!data.fss.catatan.trim() && (
                  <span style={{ fontSize: 11, color: "#c62828", marginTop: 2 }}>
                    Catatan wajib diisi jika ada anomali pada FSS.
                  </span>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* CATATAN UMUM */}
        <Section title="Catatan Umum" icon={<AlertTriangle size={16} color="#546e7a" />} defaultOpen={false}>
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
        padding: "10px 16px", display: "flex", gap: 8, justifyContent: "center",
        zIndex: 100,
      }}>
        <button onClick={handleReset} style={{
          padding: "10px 16px", borderRadius: 8, border: "1px solid #ef9a9a",
          background: "#fff", color: "#c62828", cursor: "pointer", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <RotateCcw size={14} /> Reset
        </button>
        <button onClick={handleSave} style={{
          padding: "10px 16px", borderRadius: 8, border: "1px solid #a5d6a7",
          background: saved ? "#e8f5e9" : "#fff", color: "#2e7d32", cursor: "pointer",
          fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
          transition: "background 0.2s",
        }}>
          <CheckCircle size={14} /> {saved ? "Tersimpan!" : "Simpan"}
        </button>
        <button onClick={() => setView("preview")} style={{
          padding: "10px 16px", borderRadius: 8, border: "1px solid #90caf9",
          background: "#fff", color: "#1565c0", cursor: "pointer", fontSize: 13,
          fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
        }}>
          Preview
        </button>
        <button onClick={handleExport} style={{
          padding: "10px 20px", borderRadius: 8, border: "none",
          background: "#1565c0", color: "#fff", cursor: "pointer", fontSize: 13,
          fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
          boxShadow: "0 2px 8px rgba(21,101,194,0.3)",
        }}>
          <Download size={14} /> Export PDF
        </button>
      </div>
    </div>
  );
}
