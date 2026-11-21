
import { useEffect, useState } from "react";
import api from "./api";
import "./App.css";

const slots = [
  "Morning (fasting)",
  "After breakfast",
  "After lunch",
  "After dinner",
];

const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
};

const dateKey = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { verticalAlign: "middle", flexShrink: 0 },
  };

  const icons = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    droplet: <><path d="M12 2.5S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5Z" /><path d="M9 16a3 3 0 0 0 3 3" /></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    up: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
    down: <><path d="m3 7 6 6 4-4 8 9" /><path d="M15 18h6v-6" /></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15l-.8 5Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v7m6-7v7" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    report: <><path d="M4 19V5m0 14h17" /><path d="m7 15 4-4 3 2 5-7" /></>,
  };

  return <svg {...common}>{icons[name] || icons.activity}</svg>;
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <div style={{
        width: 46,
        height: 46,
        borderRadius: 14,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 3px 12px rgba(40,20,70,0.18)",
      }}>
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 27S3.5 19.5 3.5 11.5C3.5 5.5 11 3 16 9c5-6 12.5-3.5 12.5 2.5C28.5 19.5 16 27 16 27Z"
            fill="#8056AA"
          />
          <path
            d="M16 10.5s-4.5 5-4.5 8a4.5 4.5 0 0 0 9 0c0-3-4.5-8-4.5-8Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
      <div>
        <h1 style={{ marginBottom: 3 }}>Sweety</h1>
        <p>Blood Glucose Tracker</p>
      </div>
    </div>
  );
}

function getStats(list) {
  const values = list.map(r => Number(r.glucose_value));

  return {
    count: values.length,
    average: values.length
      ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      : "0.0",
    highest: values.length ? Math.max(...values) : "--",
    lowest: values.length ? Math.min(...values) : "--",
  };
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sweetyUser") || "null");
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("sweetyToken")
  );

  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [readings, setReadings] = useState([]);
  const [value, setValue] = useState("");
  const [slot, setSlot] = useState(slots[0]);
  const [readingDate, setReadingDate] = useState(today());
  const [selectedDate, setSelectedDate] = useState(today());
  const [editingId, setEditingId] = useState(null);
  const [reportType, setReportType] = useState("daily");

  const loadReadings = async () => {
    try {
      const response = await api.get("/readings");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : data.readings || data.data || [];

      console.log("READINGS API RESPONSE:", data);
      setReadings(list);
      setMessage(`Database response received: ${list.length} readings.`);
    } catch (error) {
      console.error("READINGS FETCH ERROR:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        handleLogout();
        setMessage("Session expired. Please log in again.");
      } else {
        setMessage(
          error.response?.data?.message || "Could not load readings."
        );
      }
    }
  };

  useEffect(() => {
    if (!token) return;

    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    loadReadings();
  }, [token]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isSignup) {
        await api.post("/auth/signup", { name, email, password });
        setMessage("Account created successfully. Please log in.");
        setIsSignup(false);
        setPassword("");
      } else {
        const response = await api.post("/auth/login", { email, password });

        localStorage.setItem("sweetyToken", response.data.token);
        localStorage.setItem("sweetyUser", JSON.stringify(response.data.user));

        api.defaults.headers.common.Authorization =
          `Bearer ${response.data.token}`;

        setToken(response.data.token);
        setUser(response.data.user);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sweetyToken");
    localStorage.removeItem("sweetyUser");
    delete api.defaults.headers.common.Authorization;

    setToken(null);
    setUser(null);
    setReadings([]);
  };

  const saveReading = async (e) => {
    e.preventDefault();
    setMessage("");

    const glucose = Number(value);

    if (!Number.isInteger(glucose) || glucose < 40 || glucose > 600) {
      setMessage("Enter a whole number between 40 and 600 mg/dl.");
      return;
    }

    if (!readingDate || readingDate > today()) {
      setMessage("Future dates are not allowed.");
      return;
    }

    const sameDate = readings.filter(
      r => dateKey(r.reading_date) === readingDate &&
        String(r.id) !== String(editingId)
    );

    if (sameDate.some(r => r.time_slot === slot)) {
      setMessage("A reading already exists for this date and time slot.");
      return;
    }

    if (sameDate.length >= 4) {
      setMessage("Only four readings are allowed per day.");
      return;
    }

    const payload = {
      reading_date: readingDate,
      time_slot: slot,
      glucose_value: glucose,
    };

    setLoading(true);

    try {
      if (editingId) {
        await api.put(`/readings/${editingId}`, payload);
        setMessage("Reading updated successfully.");
      } else {
        await api.post("/readings", payload);
        setMessage("Reading added successfully.");
      }

      setEditingId(null);
      setValue("");
      setSlot(slots[0]);
      setReadingDate(today());

      await loadReadings();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save reading.");
    } finally {
      setLoading(false);
    }
  };

  const editReading = (reading) => {
    setEditingId(reading.id);
    setValue(String(reading.glucose_value));
    setSlot(reading.time_slot);
    setReadingDate(dateKey(reading.reading_date));
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteReading = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reading?")) {
      return;
    }

    try {
      await api.delete(`/readings/${id}`);
      setMessage("Reading deleted successfully.");
      await loadReadings();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete reading.");
    }
  };

  const dailyReadings = readings.filter(
    r => dateKey(r.reading_date) === selectedDate
  );

  const now = new Date();

  const currentMonth =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const previousMonth =
    `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;

  const monthReadings = readings.filter(
    r => dateKey(r.reading_date).startsWith(currentMonth)
  );

  const previousMonthReadings = readings.filter(
    r => dateKey(r.reading_date).startsWith(previousMonth)
  );

  const dailyStats = getStats(dailyReadings);
  const monthStats = getStats(monthReadings);
  const previousStats = getStats(previousMonthReadings);

  const reportReadings =
    reportType === "daily" ? dailyReadings :
    reportType === "month" ? monthReadings :
    previousMonthReadings;

  const reportStats =
    reportType === "daily" ? dailyStats :
    reportType === "month" ? monthStats :
    previousStats;

  if (!token || !user) {
    return (
      <div className="app">
        <header className="header">
          <Logo />
        </header>

        <main className="container">
          <section className="panel" style={{ maxWidth: "450px", margin: "50px auto" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Icon name="user" color="#70499f" />
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>

            <p className="subtitle">
              {isSignup
                ? "Create your Sweety account."
                : "Login to track your glucose readings."}
            </p>

            <form onSubmit={handleAuth}>
              {isSignup && (
                <>
                  <label><Icon name="user" size={16} /> Full Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </>
              )}

              <label><Icon name="mail" size={16} /> Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              <label><Icon name="lock" size={16} /> Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              {message && <p>{message}</p>}

              <button type="submit" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : isSignup
                    ? "Create Account"
                    : "Login"}
              </button>
            </form>

            <p style={{ marginTop: 20, textAlign: "center" }}>
              {isSignup
                ? "Already have an account? "
                : "Don't have an account? "}

              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setMessage("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8056aa",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {isSignup ? "Login" : "Sign up"}
              </button>
            </p>
          </section>
        </main>
      </div>
    );
  }

  const statIconStyle = {
    width: 38,
    height: 38,
    borderRadius: 11,
    background: "#f1eafa",
    color: "#70499f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  };

  return (
    <div className="app">
      <header className="header">
        <Logo />

        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name="user" size={18} />
          Welcome, {user.name}
        </span>

        <button
          onClick={handleLogout}
          style={{
            background: "#ffffff",
            color: "#56358c",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Icon name="logout" size={17} /> Logout
        </button>
      </header>

      <main className="container">
        <h2 style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name="activity" size={25} color="#70499f" />
          Daily Health Dashboard
        </h2>

        <p className="subtitle">
          Keep track of your daily blood glucose readings.
        </p>

        <section className="panel">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="calendar" size={17} color="#70499f" />
            Choose date to view readings
          </label>

          <input
            type="date"
            value={selectedDate}
            max={today()}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </section>

        <div className="stats">
          <div className="stat-card">
            <div style={statIconStyle}><Icon name="activity" size={21} /></div>
            <p>Total Readings</p>
            <h2>{dailyStats.count}/4</h2>
          </div>

          <div className="stat-card">
            <div style={statIconStyle}><Icon name="droplet" size={21} /></div>
            <p>Average Glucose</p>
            <h2>{dailyStats.average} <small>mg/dl</small></h2>
          </div>

          <div className="stat-card">
            <div style={statIconStyle}><Icon name="up" size={21} /></div>
            <p>Highest Reading</p>
            <h2>{dailyStats.highest} <small>mg/dl</small></h2>
          </div>

          <div className="stat-card">
            <div style={statIconStyle}><Icon name="down" size={21} /></div>
            <p>Lowest Reading</p>
            <h2>{dailyStats.lowest} <small>mg/dl</small></h2>
          </div>
        </div>

        <section className="panel">
          <h2 style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="droplet" color="#70499f" />
            {editingId ? "Edit Glucose Reading" : "Add Glucose Reading"}
          </h2>

          <form onSubmit={saveReading}>
            <label><Icon name="calendar" size={16} /> Date</label>
            <input
              type="date"
              value={readingDate}
              max={today()}
              onChange={e => setReadingDate(e.target.value)}
              required
            />

            <label><Icon name="activity" size={16} /> Time Slot</label>
            <select value={slot} onChange={e => setSlot(e.target.value)}>
              {slots.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <label><Icon name="droplet" size={16} /> Glucose Value (mg/dl)</label>
            <input
              type="number"
              min="40"
              max="600"
              step="1"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Enter glucose value"
              required
            />

            <button type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : editingId
                  ? "Update Reading"
                  : <><Icon name="plus" size={18} /> Add Reading</>}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setValue("");
                  setSlot(slots[0]);
                  setReadingDate(today());
                  setMessage("");
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>

          {message && (
            <p style={{ marginTop: 15, color: "#514365", fontSize: 14 }}>
              {message}
            </p>
          )}
        </section>

        <section className="panel">
          <h2 style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="calendar" color="#70499f" />
            Readings for {selectedDate}
          </h2>

          {dailyReadings.length === 0 ? (
            <p className="empty">
              No readings for this date. Add your first reading above.
            </p>
          ) : (
            dailyReadings.map(reading => (
              <div className="reading" key={reading.id}>
                <div>
                  <strong>{reading.time_slot}</strong>
                  <p>{reading.glucose_value} mg/dl</p>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="delete-btn"
                    onClick={() => editReading(reading)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#f1eafa",
                      color: "#68449a",
                      borderColor: "#dfd0f0",
                    }}
                  >
                    <Icon name="edit" size={16} /> Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => deleteReading(reading.id)}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name="trash" size={16} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="panel">
          <h2 style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="report" color="#70499f" />
            Reports
          </h2>

          <label>Choose report</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value)}
          >
            <option value="daily">Daily report</option>
            <option value="month">Month-to-date report</option>
            <option value="previous">Previous full month report</option>
          </select>

          <div className="stats" style={{ marginTop: 20 }}>
            <div className="stat-card">
              <div style={statIconStyle}><Icon name="activity" size={21} /></div>
              <p>Reading Count</p>
              <h2>{reportStats.count}</h2>
            </div>

            <div className="stat-card">
              <div style={statIconStyle}><Icon name="droplet" size={21} /></div>
              <p>Average</p>
              <h2>{reportStats.average}</h2>
            </div>

            <div className="stat-card">
              <div style={statIconStyle}><Icon name="up" size={21} /></div>
              <p>Highest</p>
              <h2>{reportStats.highest}</h2>
            </div>

            <div className="stat-card">
              <div style={statIconStyle}><Icon name="down" size={21} /></div>
              <p>Lowest</p>
              <h2>{reportStats.lowest}</h2>
            </div>
          </div>

          <h3 style={{ marginBottom: 15, color: "#302344" }}>
            {reportType === "daily"
              ? `Readings on ${selectedDate}`
              : reportType === "month"
                ? "This month's readings"
                : "Previous month's readings"}
          </h3>

          {reportReadings.length === 0 ? (
            <p className="empty">
              No readings available for this report.
            </p>
          ) : (
            reportReadings.map(reading => (
              <div className="reading" key={`report-${reading.id}`}>
                <div>
                  <strong>
                    {dateKey(reading.reading_date)} — {reading.time_slot}
                  </strong>
                  <p>{reading.glucose_value} mg/dl</p>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <footer>
        <Logo />
        <p style={{ marginTop: 12 }}>Your health, one reading at a time.</p>
      </footer>
    </div>
  );
}

export default App;
