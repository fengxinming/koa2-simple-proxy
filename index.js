'use strict';

const httpProxy = require('http-proxy');

function match(prefix, url) {
  if (url.indexOf(prefix) !== 0) {
    return false;
  }
  const newPath = url.slice(prefix.length) || '/';
  if (newPath[0] !== '/') {
    return false;
  }
  return newPath;
}

function proxyMiddleware(prefix, target, options) {

  if (prefix && typeof prefix !== 'Object' && target) {
    const proxy = httpProxy.createProxyServer({});

    if (typeof target === 'string') {
      target = {
        target: target
      };
    }

    options = options || {};
    const events = options.events;
    if (events) {
      Object.keys(events).forEach((key) => {
        const fn = events[key];
        if (typeof fn === 'function') {
          proxy.on(key, fn);
        }
      });
    }

    if (typeof prefix === 'string') {
      return (ctx, next) => {
        const newPath = match(prefix, ctx.originalUrl);
        if (newPath) {
          const req = ctx.req;
          req.url = newPath;
          proxy.web(req, ctx.res, target);
          ctx.respond = false;
        } else {
          return next();
        }
      }
    } else if (Array.isArray(prefix)) {
      return (ctx, next) => {
        let originalUrl = ctx.originalUrl;
        let newPath = '';
        if (prefix.some((n) => {
            newPath = match(n, originalUrl);
            return !!newPath;
          })) {
          const req = ctx.req;
          req.url = newPath;
          proxy.web(req, ctx.res, target);
          ctx.respond = false;
        } else {
          return next();
        }
      }
    }
  }

}

module.exports = proxyMiddleware;
