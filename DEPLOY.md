# Deployment Guide (Free Tier)

Since this project has a separate `client` folder (React) and root/server folder (Node.js), the best way to deploy for free is to split them:

1.  **Backend (Node.js/Express)** -> **Render** (Free Web Service)
2.  **Frontend (React/Vite)** -> **Vercel** or **Render** (Free Static Site)

## Part 1: Backend Deployment (Render)

1.  Push your code to **GitHub**.
2.  Go to [dashboard.render.com](https://dashboard.render.com/) and create a **New Web Service**.
3.  Connect your GitHub repository.
4.  **Settings**:
    *   **Name**: `student-marketplace-api` (or similar)
    *   **Root Directory**: `.` (leave empty or dot)
    *   **Environment**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server/server.js`
5.  **Environment Variables**:
    *   Add these in the "Environment" tab:
        *   `MONGO_URI`: (Your MongoDB Atlas Connection String)
        *   `JWT_SECRET`: (Any random long string)
        *   `SMTP_HOST`: `smtp-relay.brevo.com`
        *   `SMTP_PORT`: `587`
        *   `SMTP_USER`: (Your Brevo Email)
        *   `SMTP_PASS`: (Your Brevo API Key)
        *   `FROM_EMAIL`: (Your Verified Sender Email)
        *   `APP_URL`: (You will fill this *after* deploying the Frontend, e.g., `https://my-app.vercel.app`)

    > **Note**: On the free tier, uploaded images will disappear when the server restarts (approx every 15 mins of inactivity). For a permanent solution, you'd need Cloudinary or S3, but for a demo, this is fine.

6.  Click **Create Web Service**. Wait for it to deploy. Copy the **onrender.com URL** (e.g., `https://api-123.onrender.com`).

## Part 2: Frontend Deployment (Vercel)

1.  Go to [vercel.com](https://vercel.com/) and **Add New Project**.
2.  Import your GitHub repository.
3.  **Project Settings**:
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: Click "Edit" and select `client`. (Important!)
4.  **Environment Variables**:
    *   Add `VITE_API_URL` and set it to your Backend URL from Part 1 (e.g., `https://api-123.onrender.com`).
5.  Click **Deploy**.

## Part 3: Final Connection

1.  Once Frontend is deployed, you will get a URL like `https://student-marketplace.vercel.app`.
2.  Go back to your **Render Backend Dashboard** -> Environment.
3.  Add/Update `APP_URL` to equal `https://student-marketplace.vercel.app`.
4.  **Redeploy** the backend (Manual Deploy -> Clear Cache & Deploy) to apply the change.

Now your app is live!
