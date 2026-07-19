function getDocumentFileName(message) {
  const document = message?.document;
  const attributes = document?.attributes || [];

  for (const attr of attributes) {
    if (attr.fileName) return attr.fileName;
  }

  return null;
}

function getVideoMeta(message) {
  const document = message?.document;
  const attributes = document?.attributes || [];

  let width = null;
  let height = null;
  let duration = null;

  for (const attr of attributes) {
    if (attr.w) width = attr.w;
    if (attr.h) height = attr.h;
    if (attr.duration) duration = attr.duration;
  }

  return { width, height, duration };
}

function formatBytes(value) {
  if (!value) return null;

  const bytes = Number(value);

  if (!Number.isFinite(bytes)) return String(value);

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function getFileSize(message) {
  const size = message?.document?.size;
  if (!size) return null;
  return formatBytes(size);
}

function getMimeType(message) {
  return message?.document?.mimeType || null;
}

module.exports = {
  getDocumentFileName,
  getVideoMeta,
  getFileSize,
  getMimeType,
  formatBytes,
};