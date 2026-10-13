FROM node:20-alpine AS runtime
WORKDIR /app

COPY server/package.json ./server/package.json
COPY server/node_modules ./server/node_modules
COPY server ./server
COPY dist ./dist

ENV PORT=4747
ENV DB_PATH=/data/queue.db
EXPOSE 4747
VOLUME ["/data"]
CMD ["node", "server/index.js"]
