import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_IMAGE_TYPES = /\.(jpg|jpeg|png|gif|webp)$/i;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB ?? '5', 10) * 1024 * 1024;

export const imageUploadOptions = (subfolder: string) => ({
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads', subfolder),
    filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_IMAGE_TYPES.test(extname(file.originalname))) {
      return cb(
        new BadRequestException('Only image files are allowed (jpg, jpeg, png, gif, webp)'),
        false,
      );
    }
    cb(null, true);
  },
});
