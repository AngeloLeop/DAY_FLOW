/**
 * Application Router
 * Client-side routing, screen management, navigation
 */

(function (root) {
  const DF = root.DayFlow;
  DF.router = {
    app: null,
    initialized: false,
    routes: { login: 'template-auth-login', signup: 'template-auth-signup', lock: 'template-auth-lock', onboarding: 'template-onboarding', home: 'template-home', today: 'template-today', tasks: 'template-tasks', habits: 'template-habits', goals: 'template-goals', insights: 'template-insights' },
    guard: screen => screen,
    onRoute: () => {},
    navigationTemplate: () => null,
    init(app, options = {}) {
      if (!app) throw new Error('Router requires an application root');
      this.app = app; this.guard = options.guard || this.guard; this.onRoute = options.onRoute || this.onRoute; this.navigationTemplate = options.navigationTemplate || this.navigationTemplate;
      if (!this.initialized) { root.addEventListener('hashchange', () => this.navigate(root.location.hash.slice(1) || 'home', false)); this.initialized = true; }
    },
    navigate(requestedScreen, updateHash = true) {
      if (!this.app) throw new Error('Router has not been initialized');
      const screen = this.guard(requestedScreen);
      const templateId = this.routes[screen]; const template = templateId && root.document.getElementById(templateId);
      if (!template) throw new Error(`Unknown route: ${screen}`);
      this.app.replaceChildren(template.content.cloneNode(true));
      const navigation = this.navigationTemplate(screen); if (navigation) this.app.append(navigation);
      DF.state.set('screen', screen); if (updateHash) root.history.replaceState(null, '', `#${screen}`); const rendered = this.onRoute(screen); if (rendered?.catch) rendered.catch(error => DF.errors.report(error, `route render (${screen})`));
      return screen;
    }
  };
})(globalThis);
