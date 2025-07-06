import React, { useState, useEffect } from "react";
import "./App.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import logo from "./assets/reynardfilogo.jpg";


const BASE_URL = "http://localhost:8080/api";

function App() {
  const [upload, setUpload] = useState(0);
  const [download, setDownload] = useState(0);
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const [voucher, setVoucher] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [balance, setBalance] = useState(0);
  const [bandwidthHistory, setBandwidthHistory] = useState([]);


const [isCooldown, setIsCooldown] = useState(false);
const [cooldownTime, setCooldownTime] = useState(0);

const insertCoin = async () => {
  if (isCooldown) return; // Prevent spam

  try {
    const res = await fetch(`${BASE_URL}/coin?ip=10.0.0.20`);
    const data = await res.json();
    setMessage(data.message);
    setBalance(balance + 5);

    // ▶️ Play sound
    const audio = new Audio("/sounds/coin.mp3");
    audio.play();

    // ⏱ Start cooldown
    setIsCooldown(true);
    setCooldownTime(59); //  seconds cooldown
    const countdown = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setIsCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

  } catch (err) {
    setMessage("Coin insert failed.");
  }
};

useEffect(() => {
  const interval = setInterval(() => {
    fetch(`${BASE_URL}/bandwidth`)
      .then((res) => res.json())
      .then((data) => {
        setUpload(data.tx);
        setDownload(data.rx);
        setBandwidthHistory(prev => {
          const next = [...prev, {
            time: new Date().toLocaleTimeString(),
            upload: data.tx,
            download: data.rx
          }];
          return next.slice(-10); // show only last 10 entries
        });
      });

    // fetch("http://10.0.0.1:8080/api/status?ip=10.0.0.20")
    fetch(`${BASE_URL}/status?ip=10.0.0.20`)
      .then((res) => res.json())
      .then((data) => {
        const msLeft = data.remainingMinutes * 60 * 1000;
        if (msLeft > 0) {
          setStatus("Connected");
          const h = Math.floor(msLeft / 3600000);
          const m = Math.floor((msLeft % 3600000) / 60000);
          const s = Math.floor((msLeft % 60000) / 1000);
          setTimeLeft(
            `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
          );
        } else {
          setStatus("Disconnected");
          setTimeLeft("00:00:00");
        }
      });
  }, 5000);

  return () => clearInterval(interval);
}, []);

useEffect(() => {
  let countdownInterval;

  // Initial fetch for status and bandwidth
  const fetchData = async () => {
    try {
      // Bandwidth
      const bwRes = await fetch(`${BASE_URL}/bandwidth`);
      const bwData = await bwRes.json();
      setUpload(bwData.tx);
      setDownload(bwData.rx);
      setBandwidthHistory(prev => {
        const next = [...prev, {
          time: new Date().toLocaleTimeString(),
          upload: bwData.tx,
          download: bwData.rx
        }];
        return next.slice(-10);
      });

      // Status
      const statusRes = await fetch(`${BASE_URL}/status?ip=10.0.0.20`);
      const statusData = await statusRes.json();
      let msLeft = statusData.remainingMilliseconds;

      if (msLeft > 0) {
        setStatus("Connected");
        clearInterval(countdownInterval);

        countdownInterval = setInterval(() => {
          msLeft -= 1000;

          if (msLeft <= 0) {
            clearInterval(countdownInterval);
            setStatus("Disconnected");
            setTimeLeft("00:00:00");
            return;
          }

          const h = Math.floor(msLeft / 3600000);
          const m = Math.floor((msLeft % 3600000) / 60000);
          const s = Math.floor((msLeft % 60000) / 1000);
          setTimeLeft(
            `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
          );
        }, 1000);
      } else {
        setStatus("Disconnected");
        setTimeLeft("00:00:00");
      }

    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  fetchData();
  const mainInterval = setInterval(fetchData, 5000); // Refresh data every 5 seconds

  return () => {
    clearInterval(mainInterval);
    clearInterval(countdownInterval);
  };
}, []);


const handleVoucher = async () => {
  try {
    const res = await fetch(`${BASE_URL}/voucher`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: voucher,
        ip: "10.0.0.20" // Change to real client IP later
      }),
    });
    const data = await res.json();
    setMessage(data.message);
    if (data.success) setStatus("Connected");
  } catch (err) {
    setMessage("Failed to connect to server.");
  }
};

// const insertCoin = async () => {
//   try {
//     const res = await fetch(`${BASE_URL}/coin?ip=10.0.0.20`);
//     const data = await res.json();
//     setMessage(data.message);
//     setBalance(balance + 5); // You can also base this on time/price logic
//   } catch (err) {
//     setMessage("Coin insert failed.");
//   }
// };

  return (
    <div className="dashboard">
      <div className="logo-section">
    <img src={logo} alt="ReynardFi Logo" style={{ height: "80px" }} />
  </div>
      <div className="card bandwidth">
  <h3>Bandwidth Monitor</h3>
  <ResponsiveContainer width="100%" height={200}>
    <LineChart data={bandwidthHistory}>
      <XAxis dataKey="time" />
      <YAxis tickFormatter={(value) => (value / 1000).toFixed(0) + " KB"} />
      <Tooltip formatter={(value) => (value / 1000).toFixed(0) + " KB"} />
      <Line type="monotone" dataKey="upload" stroke="#00c853" name="Upload" />
      <Line type="monotone" dataKey="download" stroke="#2962ff" name="Download" />
    </LineChart>
  </ResponsiveContainer>
  <p>Total Bandwidth: ↑ {(upload / 1000).toFixed(0)} KB | ↓ {(download / 1000).toFixed(0)} KB</p>
</div>

      <div className="card status">
        <p className="status-label">
         ⏱  Status: <span className={status === "Connected" ? "green" : "red"}>{status}</span>
        </p>
        <h1>{timeLeft}</h1>
        <button
  className="btn insert"
  onClick={insertCoin}
  disabled={isCooldown}
>
  {isCooldown ? `Wait (${cooldownTime}s)` : "Connect"}
</button>

        <div className="voucher-section">
          <input
            type="text"
            placeholder="Voucher Code"
            value={voucher}
            onChange={(e) => setVoucher(e.target.value)}
          />
          <button className="btn voucher" onClick={handleVoucher}>🎟 Voucher</button>
        </div>
        <p className="reserve">Reserve Duration: 00:00:00</p>
      </div>

      <div className="card coin">
        <p>₱ {balance.toFixed(2)}</p>
       
        <button className="btn insert" onClick={insertCoin}>Insert Coin</button>
      </div>

      <div className="card actions">
        <button className="btn danger">Credit Code</button>
        <button className="btn danger">Gen Voucher</button>
        <button className="btn alt">Buy Load</button>
        <button className="btn alt">Extend-Via Voucher</button>
      </div>

      <div className="message">{message}</div>
    </div>
  );
}

export default App;
