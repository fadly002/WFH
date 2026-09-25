import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export function imageUploadOptions(): MulterOptions {
  const uploadDir = join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  return {
    storage: diskStorage({
      destination: uploadDir,
      filename: (_req, file, callback) => {
        const ext = extname(file.originalname).toLowerCase();
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        callback(null, name);
      },
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      const ext = extname(file.originalname).toLowerCase();
      if (!ALLOWED.has(ext)) {
        callback(new BadRequestException('Foto harus berupa JPG, PNG, atau WEBP'), false);
        return;
      }
      callback(null, true);
    },
  };
}

export function toPublicUploadUrl(filename: string): string {
  return `/uploads/${filename}`;
}
