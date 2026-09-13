import multer from 'multer';
import { ALLOWED_IMAGE_MIME, ApiErrorCode, LIMITS } from '@rokdajob/shared';
import { ApiError } from '@/utils/api-error';

/**
 * Multipart image uploads.
 *
 * Held in memory, not on disk: the buffer goes straight out to Cloudinary, and the size
 * cap bounds it. The MIME check is a first pass only — the client sets `Content-Type`, so
 * the real guarantee is Cloudinary refusing to decode a non-image.
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITS.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
      callback(
        new ApiError(
          415,
          ApiErrorCode.UNSUPPORTED_MEDIA,
          'Upload a JPEG, PNG, WebP or AVIF image',
        ),
      );
      return;
    }
    callback(null, true);
  },
});

/** Turns multer's own errors into the API's error shape. */
export function normaliseUploadError(error: unknown): unknown {
  if (!(error instanceof multer.MulterError)) return error;

  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ApiError(
      413,
      ApiErrorCode.PAYLOAD_TOO_LARGE,
      `That image is too large. The limit is ${Math.round(LIMITS.maxUploadBytes / 1024 / 1024)}MB.`,
    );
  }
  return ApiError.badRequest(error.message);
}
