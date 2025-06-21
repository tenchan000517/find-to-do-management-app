import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuthService } from '@/lib/services/google-auth-service';

export async function GET(request: NextRequest) {
  try {
    const googleAuth = GoogleAuthService.getInstance();
    const authResult = await googleAuth.testAuthentication();

    const response = {
      success: authResult.ga4 && authResult.searchConsole,
      services: {
        ga4: authResult.ga4,
        searchConsole: authResult.searchConsole,
      },
      configuration: {
        ga4PropertyId: process.env.GA4_PROPERTY_ID ? 'configured' : 'missing',
        searchConsoleSiteUrl: process.env.SEARCH_CONSOLE_SITE_URL ? 'configured' : 'missing',
        googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'file_path_configured' : 
                          (process.env.GOOGLE_CLIENT_EMAIL ? 'env_vars_configured' : 'missing'),
      },
      errors: authResult.errors,
      timestamp: new Date().toISOString(),
    };

    // Return appropriate status code
    const statusCode = response.success ? 200 : 500;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Analytics test API error:', error);
    
    return NextResponse.json({
      success: false,
      services: {
        ga4: false,
        searchConsole: false,
      },
      configuration: {
        ga4PropertyId: process.env.GA4_PROPERTY_ID ? 'configured' : 'missing',
        searchConsoleSiteUrl: process.env.SEARCH_CONSOLE_SITE_URL ? 'configured' : 'missing',
        googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'file_path_configured' : 
                          (process.env.GOOGLE_CLIENT_EMAIL ? 'env_vars_configured' : 'missing'),
      },
      errors: [`Unexpected error: ${error}`],
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}