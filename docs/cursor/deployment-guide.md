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

## Troubleshooting

### CORS Issues

If you encounter CORS issues with the Ultravox API:

1. Check that the Vite proxy configuration in `vite.config.ts` is correct
2. Verify that the frontend is correctly using the proxy URLs

### API Key Issues

If the voice agent fails to connect:

1. Check that the environment variables are correctly set in Vercel
2. Verify that the API key and Agent ID are valid
3. Check the browser console for any error messages

## Updating Your Deployment

Vercel will automatically redeploy your application whenever you push changes to the main branch of your GitHub repository. For environment variable changes, you'll need to update them in the Vercel project settings. 