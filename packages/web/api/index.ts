import app from "../src/api/index";

export const config = { runtime: "nodejs" };

export default async function handler(req: Request) {
  return app.fetch(req);
}
