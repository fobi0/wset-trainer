# Static site: nginx serves the quiz files as-is.
# Fully qualified so Podman resolves it without a registry prompt.
FROM docker.io/library/nginx:1.27-alpine

COPY index.html app.js style.css questions.json manifest.webmanifest sw.js /usr/share/nginx/html/
COPY icons /usr/share/nginx/html/icons

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q -O /dev/null http://localhost/ || exit 1
