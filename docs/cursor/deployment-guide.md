# Deployment Guide

This guide explains how to deploy the Real Estate Voice Agent application to Vercel.

## Prerequisites

- A GitHub account
- A Vercel account (you can sign up with your GitHub account)
- Ultravox API credentials (API key and Agent ID)

## Steps to Deploy

### 1. Prepare Your Repository

1. Make sure your code is committed to a GitHub repository
2. Ensure the `.env` file is not committed to the repository (it should be in `.gitignore`)
3. Verify that the frontend-only mode is working locally

### 2. Connect to Vercel

1. Log in to your Vercel account
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Select the repository containing your Real Estate Voice Agent project

### 3. Configure Project Settings

1. Set the following settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (if your repository has the frontend code in a subdirectory)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default for Vite)

2. Add the following environment variables:
   - `VITE_ULTRAVOX_API_KEY` = [Your Ultravox API Key]
   - `VITE_ULTRAVOX_API_URL` = https://api.ultravox.ai
   - `VITE_ULTRAVOX_VOICE_ID` = Emily-English (or your preferred voice)
   - `VITE_ULTRAVOX_AGENT_ID` = [Your Ultravox Agent ID]

3. Click "Deploy"

### 4. Verify Deployment

1. Once the deployment is complete, Vercel will provide a URL for your application
2. Open the URL and test the voice agent functionality
3. Verify that the voice agent can connect to the Ultravox API and respond to property queries

### 5. Custom Domain (Optional)

1. In your Vercel project settings, go to "Domains"
2. Add your custom domain and follow the instructions to configure DNS

## Deployment Options

### Frontend-Only Mode (Recommended)

For simple deployments, you can use the "frontend-only mode" which allows the application to run without a backend server:

1. Set `VITE_FRONTEND_ONLY_MODE=true` in your environment variables
2. Ensure the Ultravox API key and agent ID are set
3. Deploy only the frontend application

This mode makes direct calls to the Ultravox API and doesn't require a backend server for the voice agent functionality.

#### Vercel Deployment (Frontend-Only)

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Create a new Vercel project and connect it to your repository
3. Configure the following environment variables in the Vercel project settings:
   - `VITE_ULTRAVOX_API_KEY` = Your Ultravox API key
   - `VITE_ULTRAVOX_AGENT_ID` = Your Ultravox agent ID
   - `VITE_FRONTEND_ONLY_MODE` = `true`
4. Deploy the project
5. Test the voice agent functionality on the deployed site

#### Netlify Deployment (Frontend-Only)

1. Push your code to a Git repository
2. Create a new Netlify site and connect it to your repository
3. Add the required environment variables in the Netlify site settings:
   - `VITE_ULTRAVOX_API_KEY` = Your Ultravox API key
   - `VITE_ULTRAVOX_AGENT_ID` = Your Ultravox agent ID
   - `VITE_FRONTEND_ONLY_MODE` = `true`
4. Deploy the site
5. Test the voice agent functionality

### With Backend Server (Advanced)

If you need additional backend functionality, you can deploy with a backend server:

1. Set `VITE_FRONTEND_ONLY_MODE=false` in your frontend environment
2. Deploy both the frontend and backend servers
3. Configure the backend server with the required environment variables

## Troubleshooting Deployment Issues

### CORS Errors

If you encounter CORS errors when making direct API calls:

1. Check that you're making calls to the correct URL
2. Ensure your API key is properly set in the headers
3. Verify that your Ultravox account has the necessary permissions

### 404 Errors on API Calls

If you get 404 errors when calling the Ultravox API:

1. Ensure you're using the correct URL format:
   - In development: `/ultravox-api/api/agents/{agent-id}/calls`
   - In production: `https://api.ultravox.ai/api/agents/{agent-id}/calls`
2. Verify your agent ID is correct
3. Check that you're sending the API key in the `X-API-Key` header

### Voice Agent Not Connecting

If the voice agent fails to connect:

1. Check browser console for error messages
2. Ensure microphone permissions are granted
3. Verify WebRTC is supported in your browser
4. Check that your API key and agent ID are correct

## Updating Your Deployment

Vercel will automatically redeploy your application whenever you push changes to the main branch of your GitHub repository. For environment variable changes, you'll need to update them in the Vercel project settings. 