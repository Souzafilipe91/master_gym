/**
 * Storage local — salva arquivos no sistema de arquivos local.
 * Em produção, substitua por S3 (AWS_S3_BUCKET + AWS_REGION + credenciais),
 * Cloudflare R2, ou Supabase Storage conforme sua preferência.
 */
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

async function ensureDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  await ensureDir();
  const key = relKey.replace(/^\/+/, "");
  const filePath = path.join(UPLOAD_DIR, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data as Buffer);
  return { key, url: `/uploads/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  return { key, url: `/uploads/${key}` };
}
