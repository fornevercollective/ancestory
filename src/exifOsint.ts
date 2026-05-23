import exifr from "exifr";

/** Client-side EXIF parse for images dropped in the OSINT workbench (JPEG/HEIC/AVIF where the browser + exifr allow). */
export type ExifOsintPack = {
  fileName: string;
  latitude?: number;
  longitude?: number;
  date?: string;
  make?: string;
  model?: string;
  software?: string;
  lensModel?: string;
  orientation?: number;
  title?: string;
  artist?: string;
  copyright?: string;
  error?: string;
};

function pickStr(o: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNum(o: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return undefined;
}

export async function extractExifOsint(file: File): Promise<ExifOsintPack> {
  const base: ExifOsintPack = { fileName: file.name };
  try {
    const data = await exifr.parse(file, {
      gps: true,
      reviveValues: true,
      translateKeys: true,
      mergeOutput: true,
    });
    if (!data || typeof data !== "object") {
      base.error = "No EXIF / metadata segment (or unsupported format in-browser).";
      return base;
    }
    const o = data as Record<string, unknown>;
    const lat = pickNum(o, ["latitude", "GPSLatitude"]);
    const lon = pickNum(o, ["longitude", "GPSLongitude"]);
    if (lat != null && lon != null) {
      base.latitude = lat;
      base.longitude = lon;
    }
    base.date = pickStr(o, ["DateTimeOriginal", "CreateDate", "ModifyDate", "DateTime"]);
    base.make = pickStr(o, ["Make", "CameraManufacturer"]);
    base.model = pickStr(o, ["Model", "CameraModelName"]);
    base.software = pickStr(o, ["Software", "ProcessingSoftware"]);
    base.lensModel = pickStr(o, ["LensModel", "Lens"]);
    base.orientation = pickNum(o, ["Orientation"]);
    base.title = pickStr(o, ["Title", "ObjectName"]);
    base.artist = pickStr(o, ["Artist", "Creator"]);
    base.copyright = pickStr(o, ["Copyright", "Rights"]);

    return base;
  } catch (e) {
    base.error = e instanceof Error ? e.message : String(e);
    return base;
  }
}

export function formatExifOsintSummary(p: ExifOsintPack): string {
  if (p.error) return `EXIF error (${p.fileName}): ${p.error}`;
  const bits: string[] = [];
  if (p.latitude != null && p.longitude != null) {
    bits.push(`GPS ${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`);
  }
  if (p.date) bits.push(p.date);
  if (p.make || p.model) bits.push([p.make, p.model].filter(Boolean).join(" "));
  if (p.software) bits.push(`SW:${p.software}`);
  if (p.lensModel) bits.push(`Lens:${p.lensModel}`);
  if (p.artist) bits.push(`By:${p.artist}`);
  if (p.copyright) bits.push(`©:${p.copyright}`);
  if (bits.length === 0) return `EXIF ${p.fileName}: no high-signal fields`;
  return bits.join(" · ");
}

export function exifOsintToNotes(p: ExifOsintPack): string {
  const lines: string[] = [formatExifOsintSummary(p), ""];
  if (p.latitude != null && p.longitude != null) {
    lines.push(`https://www.google.com/maps?q=${p.latitude},${p.longitude}`);
  }
  if (p.error) lines.push(p.error);
  return lines.filter(Boolean).join("\n");
}
