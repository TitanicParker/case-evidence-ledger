function normalizeBasePath(value = process.env.SITE_BASE_PATH || "/") {
  let base = String(value || "/").trim();
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base = `${base}/`;
  return base.replace(/\/+/g, "/");
}

const basePath = normalizeBasePath();

function withBase(value = "/") {
  const path = String(value || "/");
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("mailto:") || path.startsWith("#")) return path;
  const clean = path.replace(/^\/+/, "");
  if (basePath === "/") return `/${clean}`;
  return `${basePath}${clean}`;
}

function logicalPath(value = "/") {
  const path = String(value || "/");
  if (basePath !== "/" && path.startsWith(basePath)) return `/${path.slice(basePath.length)}`;
  return path.startsWith("/") ? path : `/${path}`;
}

module.exports = { normalizeBasePath, basePath, withBase, logicalPath };
