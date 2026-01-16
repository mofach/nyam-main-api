# Dockerfile
FROM node:20-slim

WORKDIR /app

# Copy package.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy semua file (kecuali yang di .gitignore)
COPY . .

# Copy serviceAccountKey (Nanti dibuat otomatis oleh GitHub)
COPY serviceAccountKey.json ./

EXPOSE 8080

CMD ["npm", "start"]