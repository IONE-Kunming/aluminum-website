# Security Checklist

## Initial Repository Setup
- [ ] Make repository private (Settings → Danger Zone → Change visibility)
- [ ] Enable branch protection for `main` branch
- [ ] Add `FIREBASE_TOKEN` to GitHub secrets (not in code)
- [ ] Review and update `.gitignore`
- [ ] Enable Dependabot alerts (Settings → Security → Code security)
- [ ] Enable secret scanning (Settings → Security → Code security)
- [ ] Enable code scanning with CodeQL (Settings → Security → Code security)
- [ ] Set up required reviewers for pull requests

## Development Practices
- [ ] Never commit secrets, API keys, or credentials
- [ ] Use environment variables for sensitive configuration
- [ ] Escape all user inputs with `escapeHtml()`
- [ ] Validate URLs with `sanitizeUrl()`
- [ ] Review dependencies before adding (`npm audit`)
- [ ] Test Firebase security rules before deployment
- [ ] Use HTTPS only (enforced by Firebase/GitHub Pages)

## Before Each Deployment
- [ ] Run `npm run build` and verify minification
- [ ] Check build output for exposed secrets
- [ ] Run `npm audit` and fix critical vulnerabilities
- [ ] Test Firebase security rules in console
- [ ] Review code for hardcoded credentials
- [ ] Verify source maps are disabled (`sourcemap: false`)
- [ ] Check CodeQL scan results in GitHub

## Regular Maintenance
### Weekly
- [ ] Review Dependabot alerts
- [ ] Check security workflow results

### Monthly
- [ ] Run `npm audit` and update dependencies
- [ ] Review Firebase console logs for suspicious activity
- [ ] Check GitHub security alerts

### Quarterly
- [ ] Review repository access permissions
- [ ] Audit Firebase security rules
- [ ] Review storage access logs
- [ ] Update security documentation

### Annually
- [ ] Rotate Firebase CI tokens
- [ ] Review and update security policies
- [ ] Conduct security training for team

## Production Deployment
- [ ] Build artifacts are minified and obfuscated
- [ ] Console.logs removed from production build
- [ ] Source maps disabled for production
- [ ] Security headers configured in `firebase.json`
- [ ] Firebase security rules deployed
- [ ] Storage rules deployed
- [ ] HTTPS enforced

## Monitoring
- [ ] Monitor Firebase authentication logs
- [ ] Review Firestore access patterns
- [ ] Check for failed authorization attempts
- [ ] Monitor GitHub security alerts
- [ ] Review npm audit results
- [ ] Check CodeQL findings

## Security Features Enabled

### Build Configuration (vite.config.js)
- ✅ Terser minification
- ✅ Console.log removal in production
- ✅ Debugger statement removal
- ✅ Top-level variable name mangling
- ✅ Comment removal
- ✅ Source maps disabled
- ✅ Code splitting for Firebase modules

### Firebase Configuration (firebase.json)
- ✅ Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- ✅ Referrer policy
- ✅ Cache control for static assets
- ✅ HTTPS only (automatic)

### GitHub Actions
- ✅ Automated Firebase deployment
- ✅ NPM dependency audit
- ✅ CodeQL security scanning
- ✅ Secret scanning with TruffleHog

### Firebase Security
- ✅ Firestore security rules enforced
- ✅ Storage security rules enforced
- ✅ Authentication required for sensitive operations
- ✅ Role-based access control

## Emergency Response

### If Secret Exposed
1. **Immediately** revoke the exposed credential
2. Rotate affected API keys/tokens
3. Review access logs for misuse
4. Update `.gitignore` to prevent future exposure
5. Use `git-filter-repo` to remove from history if needed
6. Notify team and stakeholders

### If Vulnerability Found
1. Assess severity and impact
2. Create private security advisory on GitHub
3. Develop and test fix
4. Deploy fix as soon as possible
5. Update security documentation
6. Conduct post-mortem

## Resources
- See `SOURCE_CODE_SECURITY.md` for detailed security guide
- See `GITHUB_ACTIONS_SETUP.md` for CI/CD setup
- See `FIREBASE_DEPLOYMENT_INSTRUCTIONS.md` for deployment guide

## Contact
For security concerns, contact repository administrators immediately.
