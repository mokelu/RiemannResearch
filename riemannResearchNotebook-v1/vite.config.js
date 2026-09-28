import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * A dev-only server route: POST /api/riemann forwards the browser's request to
 * the model and returns the model's raw text. The secret lives here, on the
 * server, read from the environment (OPENAI_API_KEY) — it is never shipped in
 * browser code. JSON mode is forced so the model must answer with an object.
 * If the key is missing the route fails loudly instead of faking an answer,
 * because nothing invalid or invented is allowed through the boundary silently.
 */
function riemannServerRoute() {
  return {
    name: "riemann-server-route",
    configureServer(server) {
      server.middlewares.use("/api/riemann", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("method not allowed");
          return;
        }

        const env = loadEnv("development", process.cwd(), "");
        const apiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY;
        const model =
          process.env.OPENAI_MODEL || env.OPENAI_MODEL || "gpt-4o-mini";

        if (!apiKey) {
          res.statusCode = 500;
          res.end(
            "model call is not configured: set OPENAI_API_KEY (optionally OPENAI_MODEL) in your environment or a .env file",
          );
          return;
        }

        let body = "";
        for await (const chunk of req) body += chunk;

        let prompt, system;
        try {
          ({ prompt, system } = JSON.parse(body));
        } catch {
          res.statusCode = 400;
          res.end("request body was not valid JSON");
          return;
        }

        try {
          const upstream = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                response_format: { type: "json_object" },
                messages: [
                  { role: "system", content: system },
                  { role: "user", content: prompt },
                ],
              }),
            },
          );

          const result = await upstream.json();
          if (!upstream.ok) {
            res.statusCode = 502;
            res.end(JSON.stringify(result.error ?? result));
            return;
          }

          const text = result.choices?.[0]?.message?.content ?? "";
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ text }));
        } catch (error) {
          res.statusCode = 502;
          res.end(`upstream call failed: ${error.message}`);
        }
      });
    },
  };
}

// The notebook code is plain ESM that pulls in `ajv` (a CommonJS package) for
// validation. Pre-bundling ajv keeps Vite from tripping on it in the browser.
export default defineConfig({
  plugins: [react(), riemannServerRoute()],
  optimizeDeps: {
    include: ["ajv/dist/2020.js"],
  },
});
