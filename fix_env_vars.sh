#!/bin/bash

# Fix environment variables with newline characters

# Fix GOOGLE_CLIENT_EMAIL
echo "y" | vercel env rm GOOGLE_CLIENT_EMAIL production
echo "ga4-dashboard-service@find-to-do-analytics.iam.gserviceaccount.com" | vercel env add GOOGLE_CLIENT_EMAIL production

# Fix GOOGLE_CLIENT_ID  
echo "y" | vercel env rm GOOGLE_CLIENT_ID production
echo "108264613799320328933" | vercel env add GOOGLE_CLIENT_ID production

# Fix GOOGLE_CLIENT_X509_CERT_URL
echo "y" | vercel env rm GOOGLE_CLIENT_X509_CERT_URL production
echo "https://www.googleapis.com/robot/v1/metadata/x509/ga4-dashboard-service%40find-to-do-analytics.iam.gserviceaccount.com" | vercel env add GOOGLE_CLIENT_X509_CERT_URL production

# Fix GOOGLE_PRIVATE_KEY_ID
echo "y" | vercel env rm GOOGLE_PRIVATE_KEY_ID production
echo "03386839f7b20c834e1ae76318070f0ecae16c79" | vercel env add GOOGLE_PRIVATE_KEY_ID production

# Fix SEARCH_CONSOLE_SITE_URL
echo "y" | vercel env rm SEARCH_CONSOLE_SITE_URL production
echo "https://find-to-do.com/" | vercel env add SEARCH_CONSOLE_SITE_URL production

echo "Environment variables fixed!"