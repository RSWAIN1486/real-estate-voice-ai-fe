# Architecture

## Current Architecture (Ultravox Agent API)

```mermaid
graph TD
    A[User (Frontend)] -- voice/text --> B[VoiceAgentService (Frontend)]
    B -- API call --> C[/agent-calls (Backend)]
    C -- POST /api/agents/{agent_id}/calls --> D[Ultravox Agent API]
    D -- response --> C
    C -- response --> B
    B -- display/voice --> A
```

- All property search and Q&A is handled by the Ultravox Agent's pretrained knowledge.
- No property search tool or RAG is used.
- The backend simply proxies calls to the Ultravox Agent API using the agent ID from the environment.

## Deprecated/Removed
- DeepInfra RAG-based property search
- Property search tool (frontend/backend)

## Deployment Options

Here's a summary of potential deployment platforms discussed for the frontend and backend of this project:

### Simplified Hosting Platforms

These platforms are generally known for ease of use and minimal configuration, often with generous free tiers.

1.  **Render**:
    *   **Pros**: User-friendly, supports a wide range of applications (static sites, web services, Docker, cron jobs, databases). Good free tier. Simplifies deployment and scaling.
    *   **Cons**: Free tier has limits on build minutes and bandwidth.
    *   **Best for**: Full-stack applications where you want a balance of ease of use and flexibility for both frontend and backend, including databases.

2.  **Vercel**:
    *   **Pros**: Excellent for frontend applications (especially Next.js). Incredibly easy deployment, often zero-config. Very generous free tier for frontend/static sites. Supports serverless functions for backends.
    *   **Cons**: Not ideal for complex, traditional backends. Serverless functions have limitations.
    *   **Best for**: Frontend-heavy projects, Next.js applications, sites with serverless backends (Node.js).

3.  **Railway**:
    *   **Pros**: Easy deployment for web apps and APIs. Offers a free tier with monthly credit. Good UI. Supports popular frameworks and one-click database setups.
    *   **Cons**: Free credit might require careful management for multiple or larger projects.
    *   **Best for**: Rapidly deploying full-stack apps and prototypes, especially if you appreciate a good UI and template-based setups.

4.  **Netlify**:
    *   **Pros**: Similar to Vercel, great for frontend and static content. Good free tier. Excellent support for major frameworks. Supports serverless functions.
    *   **Cons**: Primarily frontend-focused. Serverless functions for backend, database likely hosted elsewhere.
    *   **Best for**: Static sites, Jamstack applications, frontend projects with serverless function backends.

5.  **Fly.io**:
    *   **Pros**: Focuses on global edge computing for high-performance. Deploy apps close to users. Supports Docker containers.
    *   **Cons**: Can have a steeper learning curve for configuration compared to more PaaS-like options. Costs can scale.
    *   **Best for**: Applications needing global low latency, containerized deployments.

### Major Cloud Providers (AWS & GCP)

These offer a vast range of services, providing more power and flexibility, but can also involve more configuration if not using their most abstracted services.

#### AWS (Amazon Web Services)

*   **AWS Amplify**:
    *   **Pros**: Designed for full-stack web/mobile apps. Handles backend setup (auth, API, storage, functions) and CI/CD.
    *   **Cons**: Can be opinionated; deeper customization might require more AWS knowledge.
    *   **Best for**: Rapid development of full-stack apps within the AWS ecosystem, especially with React/Angular/Vue frontends.

*   **AWS Elastic Beanstalk**:
    *   **Pros**: PaaS offering. Upload code, and it handles deployment, scaling, monitoring for various languages/Docker.
    *   **Cons**: Can have a learning curve for advanced configuration.
    *   **Best for**: Traditional web applications needing a managed environment without deep server management.

*   **AWS App Runner**:
    *   **Pros**: Simple deployment for web apps/APIs from source or container. Handles build, deploy, scale.
    *   **Cons**: Less direct control than Elastic Beanstalk.
    *   **Best for**: Containerized web applications where ease of deployment and scaling is key.

*   **AWS S3 + CloudFront (Frontend) & Lambda + API Gateway (Backend)**:
    *   **Pros**: Highly scalable, cost-effective serverless approach.
    *   **Cons**: More decoupled, requires managing separate deployments and connections.
    *   **Best for**: Static frontends needing CDN, and event-driven, serverless backends.

#### GCP (Google Cloud Platform)

*   **Google App Engine**:
    *   **Pros**: PaaS, similar to Elastic Beanstalk. Manages infrastructure, scaling, versioning.
    *   **Cons**: Standard environment can be restrictive; Flexible environment is more complex.
    *   **Best for**: Web applications where you want Google to manage the infrastructure.

*   **Google Cloud Run**:
    *   **Pros**: Fully managed platform for stateless containers. Scales to zero. Can deploy from source for some languages.
    *   **Cons**: Best for stateless apps.
    *   **Best for**: Deploying any containerized application (frontend or backend) with ease and pay-per-use.

*   **Firebase (Hosting + Cloud Functions/Cloud Run)**:
    *   **Pros**: Excellent for frontends (Firebase Hosting). Easy backend with Cloud Functions or Cloud Run integration. Rich BaaS features (DB, Auth).
    *   **Cons**: Works best within the Firebase ecosystem.
    *   **Best for**: Rapid development, mobile/web apps leveraging Firebase's integrated services.

*   **Google Cloud Storage + Cloud CDN (Frontend) & Cloud Run/App Engine (Backend)**:
    *   **Pros**: Cost-effective, scalable for static frontends with managed backend compute.
    *   **Cons**: Decoupled, requires managing separate deployments.
    *   **Best for**: Similar to the AWS S3/Lambda pattern; good for static frontends with scalable backends.

This list provides a starting point for choosing a deployment strategy based on project needs, existing infrastructure, and desired level of control versus ease of use. 