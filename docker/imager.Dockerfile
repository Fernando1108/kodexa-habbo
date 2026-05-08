# canvas@2.8.0 uses deprecated V8 APIs incompatible with Node 20 — Node 18 LTS works correctly
FROM node:18-alpine

# canvas native dependencies for Alpine Linux
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev

WORKDIR /app

# Copy package.json first — Docker layer cache: only re-runs npm install when deps change
COPY tools/imager/package.json tools/imager/package-lock.json* ./

# Install all dependencies INSIDE the container so native binaries compile for Linux
RUN npm install --production=false

# Copy source and config files
COPY tools/imager/src ./src
COPY tools/imager/index.ts ./
COPY tools/imager/tsconfig.json ./
COPY tools/imager/config.json ./
COPY tools/imager/.env ./

# Copy pre-generated Nitro JSON assets (run tools/imager/generate-gamedata.js locally first)
COPY tools/imager/figuredata.json ./
COPY tools/imager/figuremap.json ./
COPY tools/imager/effectmap.json ./

# Build TypeScript → dist/
RUN npm run build

EXPOSE 1338

CMD ["npm", "start"]
