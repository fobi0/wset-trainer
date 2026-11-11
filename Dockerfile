# Static site: nginx serves the quiz files as-is.
# Fully qualified so Podman resolves it without a registry prompt.
# 'stable-alpine' follows nginx's maintained stable line, so a rebuild picks up security fixes
# (1.27 was a 2024 mainline line without updates). Rebuild regularly: docker compose up -d --build --pull always
FROM docker.io/library/nginx:stable-alpine

COPY index.html library.html trainer.html privacy.html common.js profile.js app.js library.js trainer.js privacy.js style.css questions.json library.json manifest.webmanifest sw.js /usr/share/nginx/html/
COPY icons /usr/share/nginx/html/icons

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q -O /dev/null http://localhost/ || exit 1
