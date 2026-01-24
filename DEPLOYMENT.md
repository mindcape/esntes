# AWS Deployment Guide (Option 2)

This guide walks you through deploying the **ESNTES HOA Portal** using **AWS Amplify** (Frontend) and **AWS App Runner** (Backend). This "Serverless-like" approach handles scaling automatically.

## Prerequisites
1.  **AWS Account**: You need an active AWS account.
2.  **GitHub Repo**: Your code must be pushed to a GitHub repository.

---

### Step 2: Set up Database (Neon.tech)

1.  **Create a Neon Account**: Go to [Neon.tech](https://neon.tech/) and sign up.
2.  **Create a Project**: Create a new project (e.g., `esntes-prod`).
3.  **Get Connection String**:
    *   On the dashboard, look for the **Connection String**.
    *   Make sure to select **Poolean** (Pooled connection) if available, or just the direct connection string. It should look like:
        `postgres://neondb_owner:password@ep-cool-frog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
    *   **Keep this string safe**, you will need it for the Backend configuration.

**AWS Option (RDS Free Tier):**
1.  Go to **RDS** Console -> **Create Database**.
2.  Select **PostgreSQL** -> **Free Tier**.
3.  **Public Access**: Yes (Important for App Runner to connect easily without complex VPC setup for now).
4.  Copy the endpoint, username, and password.

---

## Part 2: Backend (AWS App Runner)

1.  **Go to AWS App Runner Console** -> **Create Service**.
2.  **Source**: "Source Code Repository".
3.  **Connect GitHub**: Authenticate and select your repository.
4.  **Configuration**:
    -   **Branch**: `main`
    -   **Deployment settings**: Automatic (deploys on push).
5.  **Build Settings**:
    -   **Runtime**: Python 3 (Not supported for direct file run usually, better to use Docker).
    -   **SELECT "Configuration file"** if you want to use `apprunner.yaml` (not created yet) OR just select **"Docker"** (Recommended since we have a Dockerfile).
    -   *If selecting Docker*:
        -   **Image**: (Wait, App Runner Source Code supports Python runtimes directly OR Docker. Since we have a `Dockerfile` in the root, select **Source Code Repo** -> **Configure your build**).
        -   Actually, for Source Code, it asks for build commands. 
        -   **EASIEST WAY**: Select **"Source Code Repository"**. Under "Configure build", select **"Use a configuration file"** is fine, OR **"Configure here"**:
            -   **Runtime**: Python 3.9
            -   **Build command**: `pip install -r backend/requirements.txt`
            -   **Start command**: `uvicorn backend.main:app --host 0.0.0.0 --port 8080`
            -   **Port**: 8080
    -   *BETTER WAY (Docker)*: Actually, App Runner "Source Code" deployment builds from your code. If you select **Source Code**, it builds a python environment. If you want it to use your `Dockerfile`, you usually need to build and push to ECR first.
    -   **LET'S STICK TO "Source Code" (Python Runtime)** for simplicity if you don't want to manage ECR.
    -   **Wait**, we made a `Dockerfile`. The best way to use the `Dockerfile` in App Runner is actually to push the image to ECR first.
    -   **Alternative**: Use **DigitalOcean App Platform** or **Render** which builds Dockerfiles from git directly. AWS App Runner "Source Code" feature is specific.
    -   **CORRECTION**: AWS App Runner *can* build from source but using its own runtimes. To use *your* Dockerfile, you must use ECR.
    -   **Recommendation**: use the **"Source Code"** option with the Python runtime settings below to avoid ECR complexity:
        -   **Build Command**: `pip install -r backend/requirements.txt`
        -   **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port 8080`
        -   **Port**: 8080 (App Runner default).
6.  **Environment Variables**:
    -   Add `DATABASE_URL`: Your Postgres connection string.
7.  **Create & Deploy**.
8.  **Result**: You will get a default domain (e.g., `https://xyz.awsapprunner.com`). **Copy this URL**.

---

## Part 3: Frontend (AWS Amplify)

1.  **Go to AWS Amplify Console** -> **Create New App** (Gen 1 or Gen 2).
2.  **Source**: GitHub.
3.  **Repository**: Select your repo.
4.  **Build Settings**: Amplify usually auto-detects Vite.
    -   Ensure `baseDirectory` is `dist` (or `frontend/dist`).
    -   If your frontend is in a subdirectory (`frontend/`), edit the build settings:
        ```yaml
        frontend:
        phases:
            preBuild:
            commands:
                - cd frontend
                - npm install
            build:
            commands:
                - npm run build
        artifacts:
            baseDirectory: frontend/dist
            files:
            - '**/*'
        cache:
            paths:
            - frontend/node_modules/**/*
        ```
5.  **Environment Variables**:
    -   Add `VITE_API_URL`: The **App Runner URL** from Part 2 (e.g., `https://xyz.awsapprunner.com`).
    -   *Note*: You need to update your frontend code to use `import.meta.env.VITE_API_URL` instead of hardcoded `localhost`.
6.  **Deploy**.

---

## Part 4: Final Config
1.  **CORS**: Update `backend/main.py` CORS origins to include your new Amplify Domain (e.g., `https://main.appId.amplifyapp.com`).
2.  **Redeploy Backend**: Push the CORS change to GitHub. App Runner will auto-redeploy.
