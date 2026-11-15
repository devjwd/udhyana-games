import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MediaItem {
  name: string;
  url: string;
  sizeBytes: number;
  sizeFormatted: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMediaFiles(dirPath: string, publicPrefix: string, extensions: string[]): MediaItem[] {
  try {
    if (!fs.existsSync(dirPath)) return [];
    const files = fs.readdirSync(dirPath);
    return files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return extensions.includes(ext);
      })
      .map((file) => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        return {
          name: file,
          url: `${publicPrefix}/${encodeURIComponent(file)}`,
          sizeBytes: stat.size,
          sizeFormatted: formatBytes(stat.size)
        };
      });
  } catch (err) {
    console.warn(`[StationMediaAPI] Error reading ${dirPath}:`, err);
    return [];
  }
}

export async function GET() {
  const publicDir = path.join(process.cwd(), 'public');
  const videosDir = path.join(publicDir, 'videos');
  const imagesDir = path.join(publicDir, 'images');

  const videoExts = ['.mp4', '.webm', '.mkv', '.mov', '.ogg'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

  const videos = getMediaFiles(videosDir, '/videos', videoExts);
  const images = getMediaFiles(imagesDir, '/images', imageExts);

  return NextResponse.json({
    success: true,
    videos,
    images,
    totalFiles: videos.length + images.length
  });
}

