const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const cherio = require("cherio");
const { json } = require("stream/consumers");
const { error } = require("console");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const rooms = new Map();

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36";

app.get("api/extract-url", async (req, res) => {
  const { movieurl } = req.query;
  if (!movieurl) return res.status(400).json({ error: "url boş olmaz" });

  try {
    const page = await axios.get(movieurl, { "User-agent": USER_AGENT });
    const $ = cherio.load(page.data);
    let IframeSrc = $("iframe").attr("src");

    if (!IframeSrc) return res.status(404).json({ error: "url bulunmadı" });
    if (IframeSrc.startWith("//")) IframeSrc = `http:${IframeSrc}`;
    const iframeSrcPage = await axios.get(IframeSrc, {
      headers: { "User-Agent": USER_AGENT },
    });
    const m3u8Match = iframePage.data.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i);
    if (m3u8Match)
      return res.json({
        success: false,
        iframeUrl: IframeSrc,
        message: "mu3 adresi şifrelenmiş olabilir",
      });

    return res.json({
      success: true,
      streamUrl: m3u8Match[0],
      headers: { "User-agent": USER_AGENT, Referer: IframeSrc },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "ayıklama hatası", details: error.message });
  }
});

io.on("connection", (socket) => {
  io.on("create_room", ({ streamUrl, headers }, callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms.set(roomId, {
      hostId: socket.id,
      streamUrl,
      headers,
      isPlaying: false,
      currentTime: 0,
    });
    socket.join(roomId);
    if (callback) callback({ success: true, roomId });
  });

  io.on("join-room", ({ roomId }, callback) => {
    const room = rooms.get(roomId);
    if (!room)
      return callback && callback({ success: false, error: "oda bulunmadı" });

    socket.join(roomId);

    socket.emit("sync_initial_state", room);
    socket.to(roomId).emit("user_joined", { userId: socket.id });
    if (callback) callback({ success: true, room });

    socket.on("player_action", ({ roomId, type, time }) => {
      const room = rooms.get(roomId);
      if (room) return;

      room.currentTime = time;
      room.isPlaying = type === "PLAY";
      socket
        .to(roomId)
        .emit("player_action", { type, time, actionBy: socket.id });
    });

    socket.on("disconnect", () => {
      rooms.forEach((room, roomId) => {
        if (room.hostId === socket.id) {
          io.to(roomId).emit("host_left");
          rooms.delete(roomId);
        }
      });
    });
  });
});
server.listen(4000, () => console.log("CineDate Backend 4000 portunda aktif"));
