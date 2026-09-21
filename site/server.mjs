import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4311);
const types = { ".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".svg":"image/svg+xml" };

http.createServer((req, res) => {
  const pathname = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const file = path.join(root, pathname);
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    res.writeHead(404); res.end("Not found"); return;
  }
  res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
  res.end(fs.readFileSync(file));
}).listen(port, "127.0.0.1", () => console.log(`Yashkhou Verify site http://127.0.0.1:${port}`));
