import { google } from 'googleapis';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private auth: any;
  private ga4Client: BetaAnalyticsDataClient | null = null;
  private searchConsoleClient: any = null;

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  private async initializeAuth() {
    try {
      // Service account authentication
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.auth = new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          scopes: [
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/webmasters.readonly',
          ],
        });
      } else {
        // Fallback to environment variables for service account key
        const credentials = {
          type: "service_account",
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
        };

        this.auth = new google.auth.GoogleAuth({
          credentials,
          scopes: [
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/webmasters.readonly',
          ],
        });
      }
    } catch (error) {
      console.error('Google Auth initialization failed:', error);
    }
  }

  public async getGA4Client(): Promise<BetaAnalyticsDataClient> {
    if (!this.ga4Client) {
      try {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          this.ga4Client = new BetaAnalyticsDataClient({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          });
        } else {
          const credentials = {
            type: "service_account",
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
          };

          this.ga4Client = new BetaAnalyticsDataClient({
            credentials,
          });
        }
      } catch (error) {
        console.error('GA4 Client initialization failed:', error);
        throw error;
      }
    }
    return this.ga4Client;
  }

  public async getSearchConsoleClient() {
    if (!this.searchConsoleClient) {
      try {
        const authClient = await this.auth.getClient();
        this.searchConsoleClient = google.webmasters({
          version: 'v3',
          auth: authClient,
        });
      } catch (error) {
        console.error('Search Console Client initialization failed:', error);
        throw error;
      }
    }
    return this.searchConsoleClient;
  }

  public async testAuthentication(): Promise<{
    ga4: boolean;
    searchConsole: boolean;
    errors: string[];
  }> {
    const result = {
      ga4: false,
      searchConsole: false,
      errors: [] as string[],
    };

    // Test GA4 connection
    try {
      const ga4Client = await this.getGA4Client();
      const propertyId = process.env.GA4_PROPERTY_ID;
      
      if (!propertyId) {
        result.errors.push('GA4_PROPERTY_ID is not configured');
      } else {
        // Simple test request to GA4
        await ga4Client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'sessions' }],
          limit: 1,
        });
        result.ga4 = true;
      }
    } catch (error) {
      result.errors.push(`GA4 authentication failed: ${error}`);
    }

    // Test Search Console connection
    try {
      const searchConsoleClient = await this.getSearchConsoleClient();
      const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
      
      if (!siteUrl) {
        result.errors.push('SEARCH_CONSOLE_SITE_URL is not configured');
      } else {
        // Simple test request to Search Console
        await searchConsoleClient.sites.list();
        result.searchConsole = true;
      }
    } catch (error) {
      result.errors.push(`Search Console authentication failed: ${error}`);
    }

    return result;
  }
}