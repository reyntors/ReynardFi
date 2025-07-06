const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());



// Simulated in-memory database
const vouchers = {
  "REY123": 30, // 30 minutes
  "VIP456": 60,
  "TEST789": 120
};

const activeUsers = {}; // { ip: expirationTimestamp }

// 🪙 Coin insertion: Adds +15 minutes
app.get("/api/coin", (req, res) => {
  const ip = req.query.ip;
  const now = Date.now();

  if (!ip) return res.status(400).json({ success: false, message: "Missing IP" });

  const timeToAdd = 15 * 60 * 1000;

  activeUsers[ip] = Math.max(now, activeUsers[ip] || 0) + timeToAdd;

  res.json({
    success: true,
    message: "Coin accepted: +15 minutes added.",
    expiresAt: activeUsers[ip]
  });
});

// 🎟 Voucher redemption
app.post("/api/voucher", (req, res) => {
  const { code, ip } = req.body;
  const now = Date.now();

  if (!ip || !code) return res.status(400).json({ success: false, message: "Missing code or IP" });

  const minutes = vouchers[code];

  if (!minutes) {
    return res.json({ success: false, message: "Invalid or already used voucher code." });
  }

  const timeToAdd = minutes * 60 * 1000;
  activeUsers[ip] = Math.max(now, activeUsers[ip] || 0) + timeToAdd;

  delete vouchers[code]; // invalidate used code

  res.json({
    success: true,
    message: `Voucher accepted: +${minutes} minutes.`,
    expiresAt: activeUsers[ip]
  });
});

// ⏱ Status check (optional)
app.get("/api/status", (req, res) => {
  const ip = req.query.ip;
  const now = Date.now();
  const remaining = activeUsers[ip] ? Math.max(0, activeUsers[ip] - now) : 0;

  res.json({
    ip,
    remainingMilliseconds: remaining,
    active: remaining > 0
  });
});





const os = require("os");
const { execSync } = require("child_process");

// app.get("/api/bandwidth", (req, res) => {
//   try {
//     // You can change `wlan0` or `eth0` to the correct interface
//     const rx = execSync("cat /sys/class/net/wlan0/statistics/rx_bytes").toString();
//     const tx = execSync("cat /sys/class/net/wlan0/statistics/tx_bytes").toString();

//     res.json({
//       rx: parseInt(rx), // Download
//       tx: parseInt(tx)  // Upload
//     });
//   } catch (e) {
//     res.status(500).json({ message: "Error reading bandwidth", error: e.message });
//   }
// });


//tesing purposes
app.get("/api/bandwidth", (req, res) => {
  // Simulated upload/download bytes
  const tx = Math.floor(Math.random() * 5000000); // upload bytes
  const rx = Math.floor(Math.random() * 10000000); // download bytes

  res.json({
    tx,
    rx,
    note: "Simulated bandwidth (dev mode)"
  });
});


app.listen(PORT, () => {
  console.log(`✅ Piso WiFi backend running at http://localhost:${PORT}`);
});
