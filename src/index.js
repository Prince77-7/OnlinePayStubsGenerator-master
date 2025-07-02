// Container class definition for Cloudflare
export class PaystubApp {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    try {
      // Start container if not already running
      const containerInstance = await this.ctx.container.start({
        env: {
          NODE_ENV: "production"
        }
      });
      
      // Forward the request to the container
      return await containerInstance.fetch(request);
    } catch (error) {
      console.error("Container error:", error);
      return new Response(`Container Error: ${error.message}`, { 
        status: 500,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
}

// Worker request handler
export default {
  async fetch(request, env, ctx) {
    try {
      // Get Durable Object instance
      const id = env.PAYSTUB_APP.idFromName("main");
      const obj = env.PAYSTUB_APP.get(id);
      
      // Forward request to Durable Object
      return await obj.fetch(request);
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(`Application Error: ${error.message}`, { 
        status: 500,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
}; 