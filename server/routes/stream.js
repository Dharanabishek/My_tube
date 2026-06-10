import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import Video from "../Modals/video.js";
import jwtAuth from "../middleware/jwtAuth.js";
import { getMimeType, resolveVideoFilePath } from "../utils/videoFile.js";

const router = express.Router();

const STREAM_SECRET = process.env.STREAM_SECRET || "dev_stream_secret";

function signPayload(videoId, userId, expiresAt) {
  const payload = `${videoId}|${userId || ''}|${expiresAt}`;
  const sig = crypto.createHmac('sha256', STREAM_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64');
}

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length < 4) return null;
    const [videoId, userId, expiresAt, sig] = parts;
    const payload = `${videoId}|${userId}|${expiresAt}`;
    const expected = crypto.createHmac('sha256', STREAM_SECRET).update(payload).digest('hex');
    if (expected !== sig) return null;
    if (Number(expiresAt) < Date.now()) return null;
    return { videoId, userId, expiresAt: Number(expiresAt) };
  } catch (err) {
    return null;
  }
}

// generate signed link (POST) - body: { videoId, userId, ttlSeconds }
router.post('/generate-link', jwtAuth, async (req, res) => {
  try {
    const { videoId, ttlSeconds = 300 } = req.body;
    const userId = req.user?.id;
    if (!videoId) return res.status(400).json({ message: 'videoId required' });
    const expiresAt = Date.now() + (Number(ttlSeconds) * 1000);
    const token = signPayload(videoId, userId, expiresAt);
    const url = `/stream/video/${videoId}?token=${encodeURIComponent(token)}`;
    return res.status(200).json({ url, expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not generate link' });
  }
});

// Stream video with Range support
router.get('/video/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.query.token;
    const authHeader = req.headers.authorization || '';

    // validate either token or JWT (via jwtAuth-like check)
    let validUserId = null;
    if (token) {
      const v = verifyToken(String(token));
      if (!v) return res.status(401).json({ message: 'Invalid or expired token' });
      validUserId = v.userId || null;
    } else if (authHeader.startsWith('Bearer ')) {
      try {
        // reuse jwt verify
        const jwtModule = await import('jsonwebtoken');
        const jwt = jwtModule.default || jwtModule;
        const payload = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'dev_jwt_secret');
        validUserId = payload.id;
      } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const actualPath = resolveVideoFilePath(video.filepath);
    if (!actualPath || !fs.existsSync(actualPath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    const stat = fs.statSync(actualPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const mimeType = getMimeType(actualPath);

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=86400',
      });
      const stream = fs.createReadStream(actualPath, { start, end });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=86400',
      });
      const stream = fs.createReadStream(actualPath);
      stream.pipe(res);
    }
  } catch (err) {
    console.error('stream error', err);
    return res.status(500).json({ message: 'Stream failed' });
  }
});

export default router;
