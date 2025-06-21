#!/bin/bash

# Vercel環境変数設定スクリプト

echo "Setting up Vercel environment variables..."

# GA4設定
echo "463408278" | vercel env add GA4_PROPERTY_ID production
echo "G-MBY772GM88" | vercel env add GA4_MEASUREMENT_ID production

# Search Console設定
echo "https://find-to-do.com/" | vercel env add SEARCH_CONSOLE_SITE_URL production

# Google認証設定
echo "find-to-do-analytics" | vercel env add GOOGLE_PROJECT_ID production
echo "03386839f7b20c834e1ae76318070f0ecae16c79" | vercel env add GOOGLE_PRIVATE_KEY_ID production
echo "ga4-dashboard-service@find-to-do-analytics.iam.gserviceaccount.com" | vercel env add GOOGLE_CLIENT_EMAIL production
echo "108264613799320328933" | vercel env add GOOGLE_CLIENT_ID production
echo "https://www.googleapis.com/robot/v1/metadata/x509/ga4-dashboard-service%40find-to-do-analytics.iam.gserviceaccount.com" | vercel env add GOOGLE_CLIENT_X509_CERT_URL production

echo "Vercel environment variables setup completed!"