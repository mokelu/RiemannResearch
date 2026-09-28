// Cloudflare Worker entry point
// Sync endpoint for local-first notebooks

export default {
  async fetch(request: Request): Promise<Response> {
    return new Response("Riemann sync endpoint", { status: 200 });
  },
};
