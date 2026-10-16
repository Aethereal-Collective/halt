# Halt landing page (halt.aethereal.top). Same setup as aethereal-website: Nuxt server in node:alpine.
# Build from the REPO ROOT, because the privacy page reads docs/privacy-policy*.md from outside site/:
#   docker build -f site/Dockerfile -t halt-landing .
FROM node:24-alpine AS build

WORKDIR /app/site

# Dependencies first so they stay cached while only the code changes.
# --ignore-scripts: postinstall runs `nuxt prepare`, which needs the sources copied below.
COPY site/package*.json ./
RUN npm ci --ignore-scripts

COPY site/ ./
COPY docs/privacy-policy.md docs/privacy-policy.en.md /app/docs/
RUN npm run build

FROM node:24-alpine AS prod

WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/site/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
