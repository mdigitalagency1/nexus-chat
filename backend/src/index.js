require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("./config/database");
const { connectRedis } = require("./config/redis");
const { initSocketServer } = require("./socket");
const routes = require("./routes");

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use("/api/", limiter);
app.use("/api", routes);
app.get("/health", (req, res) => res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(err.status || 500).json({ error: err.message }); });

const PORT = process.env.PORT || 5000;
async function bootstrap() {
  await connectDB();
  await connectRedis();
  initSocketServer(server);
  server.listen(PORT, () => {
    console.log("🚀 Nexus Chat running on port " + PORT);
    console.log("🔒 E2E encryption enabled");
    console.log("🌐 Health: http://localhost:" + PORT + "/health");
  });
}
bootstrap().catch(console.error);
module.exports = { app, server };