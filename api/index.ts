import app from "../packages/web/src/api/index.js";
export type { AppType } from "../packages/web/src/api/index.js";

export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  const host = req.headers["host"] ?? "localhost";
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const url = `${protocol}://${host}${req.url}`;

  const bodyChunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<Buffer>) {
    bodyChunks.push(chunk);
  }
  const body = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers as Record<string, string | string[]>) ) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const request = new Request(url, {
    method: req.method ?? "GET",
    headers,
    body: body?.length ? body : undefined,
  });

  const response = await app.fetch(request as any);

  res.status(response.status);
  response.headers.forEach((value: string, key: string) => res.setHeader(key, value));
  const responseBody = await response.arrayBuffer();
  res.end(Buffer.from(responseBody));
}