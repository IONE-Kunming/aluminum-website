// Simple SPA Router
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.basePath = '/aluminum-website';
    
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
