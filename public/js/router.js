// Simple SPA Router
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    // Get base path from Vite's import.meta.env.BASE_URL, removing trailing slash
    this.basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    // If basePath is just '/', set it to empty string for cleaner logic
    if (this.basePath === '/') this.basePath = '';
    
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Handle initial load
    document.addEventListener('DOMContentLoaded', () => this.handleRoute());
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    const fullPath = this.basePath + path;
    window.history.pushState({}, '', fullPath);
    this.handleRoute();
  }

  handleRoute() {
    const path = window.location.pathname.replace(this.basePath, '') || '/';
    this.currentRoute = path;
    
    const handler = this.routes[path] || this.routes['*'];
    if (handler) {
      handler();
    }
  }

  getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params);
  }
}

const router = new Router();
export default router;
