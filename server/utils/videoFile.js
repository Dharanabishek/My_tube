import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(serverDir, "..");

export function resolveVideoFilePath(filepath = "") {
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(rootDir, "uploads"));
  const relativePath = filepath.startsWith("/") ? filepath.slice(1) : filepath;
  const candidates = [
    path.resolve(rootDir, relativePath),
    path.resolve(rootDir, filepath.replace(/^\/?uploads[\\/]/, "uploads/")),
    path.resolve(uploadsDir, path.basename(filepath)),
  ];

  const actualPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!actualPath) return null;

  const resolved = path.resolve(actualPath);
  if (!resolved.startsWith(uploadsDir)) return null;
  return resolved;
}

export function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";
  return "application/octet-stream";
}
