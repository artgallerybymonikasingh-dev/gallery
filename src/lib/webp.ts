import "server-only";
import sharp from "sharp";

// Converts any uploaded image to WebP: smaller/faster to load than raw JPEGs,
// and re-encoding strips EXIF (GPS, camera/device info) and any bytes hiding
// past the image data, which raw uploads would otherwise pass straight
// through to public storage.
export async function toWebp(buffer: Buffer, maxDimension = 2400): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // apply EXIF orientation before stripping metadata
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
}
