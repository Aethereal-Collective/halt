# Halt landing page (halt.aethereal.top). Same setup as aethereal-website: Nuxt server in node:alpine.
# Build from the REPO ROOT, because the privacy page reads docs/privacy-policy*.md from outside site/:
#   docker build -f site/Dockerfile -t halt-landing .
FROM node:24-alpine AS build

WORKDIR /app/site

# Dependencies first so they stay cached while only the code changes.
# `npm install`, not `npm ci`: the lockfile is written on Windows and lacks Linux-only optional deps
# (e.g. @emnapi/* for the wasm builds), which `npm ci` rejects as out of sync.
# --ignore-scripts: postinstall runs `nuxt prepare`, which needs the sources copied below.
COPY site/package*.json ./
RUN npm install --ignore-scripts --no-audit --no-fund

COPY site/ ./
COPY docs/privacy-policy.md docs/privacy-policy.en.md /app/docs/
RUN npm run build

FROM node:24-alpine AS prod

WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/site/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
