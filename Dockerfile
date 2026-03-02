FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

Click **Commit changes** → Railway will auto-redeploy.

---

**At the same time, go add your Variables** — click the **Variables** tab in Railway and add these now so the server starts correctly after the build:
```
JWT_SECRET   = shriaaum_secret_key_bliv2026
NODE_ENV     = production
PORT         = 5000
CLIENT_URL   = https://e-commecs-w879.vercel.app
