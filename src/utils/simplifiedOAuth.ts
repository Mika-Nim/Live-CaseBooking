// Simplified OAuth Configuration for Email Integration
// Pre-configured OAuth applications for Google and Microsoft

interface OAuthConfig {
  clientId: string;
  scopes: string[];
  redirectUri: string;
}

interface OAuthProvider {
  name: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  config: OAuthConfig;
}

// Pre-configured OAuth applications
// Note: In production, these should be environment variables or secure configuration
const OAUTH_PROVIDERS: Record<'google' | 'microsoft', OAuthProvider> = {
  google: {
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    config: {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'NOT_CONFIGURED',
      scopes: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      redirectUri: `${window.location.origin}/auth/callback`
    }
  },
  microsoft: {
    name: 'Microsoft',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    config: {
      clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID || 'NOT_CONFIGURED',
      scopes: [
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/User.Read',
        'offline_access'
      ],
      redirectUri: `${window.location.origin}/auth/callback`
    }
  }
};

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: number;
}

// PKCE (Proof Key for Code Exchange) utilities
interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
}

function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

async function generatePKCEChallenge(): Promise<PKCEChallenge> {
  const codeVerifier = generateRandomString(128);
  
  // Create SHA256 hash of the code verifier
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64url - compatible with older TypeScript
  const bytes = new Uint8Array(digest);
  let binaryString = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  const base64String = btoa(binaryString);
  const codeChallenge = base64String
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return {
    codeVerifier,
    codeChallenge
  };
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

class SimplifiedOAuthManager {
  private provider: 'google' | 'microsoft';
  private config: OAuthProvider;
  private pkceChallenge?: PKCEChallenge;

  constructor(provider: 'google' | 'microsoft') {
    this.provider = provider;
    this.config = OAUTH_PROVIDERS[provider];
  }

  /**
   * Check if OAuth is properly configured for this provider
   */
  isConfigured(): boolean {
    const clientId = this.config.config.clientId;
    return !!(clientId && 
              clientId !== 'NOT_CONFIGURED' && 
              !clientId.includes('your-dev-') && 
              !clientId.includes('your-prod-'));
  }

  /**
   * Generate OAuth authorization URL with PKCE support
   */
  async getAuthUrl(state?: string): Promise<string> {
    console.log(`[OAuth] Building auth URL for ${this.provider}`);
    const params: Record<string, string> = {
      client_id: this.config.config.clientId,
      response_type: 'code',
      scope: this.config.config.scopes.join(' '),
      redirect_uri: this.config.config.redirectUri,
      state: state || `${this.provider}_${Date.now()}`
    };

    console.log(`[OAuth] Base parameters:`, {
      provider: this.provider,
      clientId: this.config.config.clientId.substring(0, 8) + '...',
      redirectUri: this.config.config.redirectUri,
      scopes: this.config.config.scopes
    });

    // Add PKCE for Microsoft (required) and Google (recommended)
    if (this.provider === 'microsoft' || this.provider === 'google') {
      console.log(`[OAuth] Generating PKCE challenge for ${this.provider}`);
      this.pkceChallenge = await generatePKCEChallenge();
      params.code_challenge = this.pkceChallenge.codeChallenge;
      params.code_challenge_method = 'S256';
      console.log(`[OAuth] PKCE challenge generated:`, {
        codeChallenge: this.pkceChallenge.codeChallenge.substring(0, 20) + '...',
        method: 'S256'
      });
    }

    // Provider-specific parameters
    if (this.provider === 'google') {
      params.access_type = 'offline'; // For refresh tokens
      params.prompt = 'consent'; // Force consent to get refresh token
      console.log(`[OAuth] Added Google-specific parameters: access_type=offline, prompt=consent`);
    }

    const authUrl = `${this.config.authUrl}?${new URLSearchParams(params).toString()}`;
    console.log(`[OAuth] Final auth URL constructed for ${this.provider}`);
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens with PKCE support
   */
  async exchangeCodeForTokens(code: string): Promise<AuthTokens> {
    if (!this.pkceChallenge) {
      throw new Error('PKCE challenge not found. Make sure to call getAuthUrl first.');
    }

    const body = new URLSearchParams({
      client_id: this.config.config.clientId,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.config.redirectUri,
      code_verifier: this.pkceChallenge.codeVerifier // PKCE code verifier
    });

    // Note: In production, token exchange should happen on backend for security
    // This is a simplified frontend-only implementation
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        provider: this.provider
      });
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Token exchange response:', { 
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      expiresIn: data.expires_in
    });
    const expiresAt = Date.now() + (data.expires_in * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      expiresAt
    };
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch(this.config.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('User info request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        provider: this.provider
      });
      throw new Error(`Failed to get user info: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('User info response:', { 
      provider: this.provider,
      hasEmail: !!data.email || !!data.mail || !!data.userPrincipalName,
      hasId: !!data.id,
      hasName: !!data.name || !!data.displayName
    });

    // Normalize response format between Google and Microsoft
    if (this.provider === 'google') {
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture
      };
    } else {
      // Microsoft Graph API
      return {
        id: data.id,
        email: data.mail || data.userPrincipalName,
        name: data.displayName,
        picture: data.photo?.value
      };
    }
  }

  /**
   * Send email using provider's API
   */
  async sendEmail(accessToken: string, emailData: {
    to: string[];
    subject: string;
    body: string;
    from?: string;
    attachments?: Array<{
      filename: string;
      content: string; // base64 encoded content
      contentType: string;
    }>;
  }): Promise<boolean> {
    if (this.provider === 'google') {
      return this.sendGmailEmail(accessToken, emailData);
    } else {
      return this.sendOutlookEmail(accessToken, emailData);
    }
  }

  private async sendGmailEmail(accessToken: string, emailData: {
    to: string[];
    subject: string;
    body: string;
    from?: string;
    attachments?: Array<{
      filename: string;
      content: string; // base64 encoded content
      contentType: string;
    }>;
  }): Promise<boolean> {
    // Gmail API implementation
    let message: string;
    
    if (emailData.attachments && emailData.attachments.length > 0) {
      // MIME multipart message with attachments
      const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);
      message = [
        `To: ${emailData.to.join(', ')}`,
        `Subject: ${emailData.subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        `Content-Type: text/html; charset=utf-8`,
        '',
        emailData.body,
        ''
      ].join('\n');
      
      // Add attachments
      emailData.attachments.forEach(attachment => {
        message += [
          `--${boundary}`,
          `Content-Type: ${attachment.contentType}`,
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          `Content-Transfer-Encoding: base64`,
          '',
          attachment.content,
          ''
        ].join('\n');
      });
      
      message += `--${boundary}--`;
    } else {
      // Simple text/html message
      message = [
        `To: ${emailData.to.join(', ')}`,
        `Subject: ${emailData.subject}`,
        `Content-Type: text/html; charset=utf-8`,
        '',
        emailData.body
      ].join('\n');
    }

    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    return response.ok;
  }

  private async sendOutlookEmail(accessToken: string, emailData: {
    to: string[];
    subject: string;
    body: string;
    from?: string;
    attachments?: Array<{
      filename: string;
      content: string; // base64 encoded content
      contentType: string;
    }>;
  }): Promise<boolean> {
    // Microsoft Graph API implementation
    const message: any = {
      message: {
        subject: emailData.subject,
        body: {
          contentType: 'HTML',
          content: emailData.body
        },
        toRecipients: emailData.to.map(email => ({
          emailAddress: {
            address: email
          }
        }))
      }
    };
    
    // Add attachments if provided
    if (emailData.attachments && emailData.attachments.length > 0) {
      message.message.attachments = emailData.attachments.map(attachment => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: attachment.filename,
        contentType: attachment.contentType,
        contentBytes: attachment.content
      }));
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    return response.ok;
  }
}

// Token storage utilities
export const storeAuthTokens = (country: string, provider: string, tokens: AuthTokens): void => {
  const key = `email_auth_${country}_${provider}`;
  localStorage.setItem(key, JSON.stringify(tokens));
};

// User info storage utilities
export const storeUserInfo = (country: string, provider: string, userInfo: UserInfo): void => {
  const key = `email_userinfo_${country}_${provider}`;
  localStorage.setItem(key, JSON.stringify(userInfo));
};

export const getStoredUserInfo = (country: string, provider: string): UserInfo | null => {
  const key = `email_userinfo_${country}_${provider}`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const clearUserInfo = (country: string, provider: string): void => {
  const key = `email_userinfo_${country}_${provider}`;
  localStorage.removeItem(key);
};

export const getStoredAuthTokens = (country: string, provider: string): AuthTokens | null => {
  const key = `email_auth_${country}_${provider}`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const clearAuthTokens = (country: string, provider: string): void => {
  const key = `email_auth_${country}_${provider}`;
  localStorage.removeItem(key);
  // Also clear user info when clearing tokens
  clearUserInfo(country, provider);
};

export const isTokenExpired = (tokens: AuthTokens): boolean => {
  return Date.now() >= tokens.expiresAt;
};

// Factory function
export const createOAuthManager = (provider: 'google' | 'microsoft'): SimplifiedOAuthManager => {
  return new SimplifiedOAuthManager(provider);
};

// Popup-based authentication flow with PKCE support
export const authenticateWithPopup = async (
  provider: 'google' | 'microsoft',
  country: string
): Promise<{ tokens: AuthTokens; userInfo: UserInfo }> => {
  console.log(`[OAuth] Creating OAuth manager for ${provider}`);
  const oauth = createOAuthManager(provider);
  
  // Check if OAuth is properly configured
  if (!oauth.isConfigured()) {
    const providerName = provider === 'google' ? 'Google' : 'Microsoft';
    const envVar = provider === 'google' ? 'REACT_APP_GOOGLE_CLIENT_ID' : 'REACT_APP_MICROSOFT_CLIENT_ID';
    throw new Error(`${providerName} OAuth is not configured. Please set the ${envVar} environment variable with a valid client ID.`);
  }
  
  try {
    // Generate auth URL with PKCE (async operation)
    console.log(`[OAuth] Generating auth URL for ${provider}`);
    const authUrl = await oauth.getAuthUrl(`${country}_${Date.now()}`);
    console.log(`[OAuth] Auth URL generated:`, authUrl.substring(0, 100) + '...');

    return new Promise((resolve, reject) => {
      console.log(`[OAuth] Opening popup window for ${provider}`);
      const popup = window.open(
        authUrl,
        'oauth_auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        console.error(`[OAuth] Popup blocked for ${provider}`);
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      console.log(`[OAuth] Popup opened successfully for ${provider}, waiting for callback...`);

      // Listen for auth completion
      const messageHandler = async (event: MessageEvent) => {
        console.log(`[OAuth] Received message from popup:`, {
          origin: event.origin,
          expectedOrigin: window.location.origin,
          dataType: event.data?.type,
          hasCode: !!event.data?.code
        });
        
        if (event.origin !== window.location.origin) {
          console.warn(`[OAuth] Ignoring message from different origin: ${event.origin}`);
          return;
        }

        if ((event.data.type === 'oauth_success' || event.data.type === 'sso_auth_success') && event.data.code) {
          try {
            console.log(`[OAuth] Received authorization code for ${provider}, exchanging for tokens...`);
            const tokens = await oauth.exchangeCodeForTokens(event.data.code);
            console.log(`[OAuth] Token exchange successful for ${provider}, fetching user info...`);
            
            const userInfo = await oauth.getUserInfo(tokens.accessToken);
            console.log(`[OAuth] User info retrieved for ${provider}:`, { email: userInfo.email, id: userInfo.id });
            
            // Store tokens and user info
            console.log(`[OAuth] Storing tokens and user info for ${provider} in ${country}`);
            storeAuthTokens(country, provider, tokens);
            storeUserInfo(country, provider, userInfo);
            
            console.log(`[OAuth] Cleaning up event listeners and closing popup`);
            window.removeEventListener('message', messageHandler);
            popup.close();
            
            console.log(`[OAuth] Resolving with tokens and userInfo`);
            resolve({ tokens, userInfo });
          } catch (error) {
            console.error(`[OAuth] OAuth flow failed for ${provider}:`, error);
            window.removeEventListener('message', messageHandler);
            popup.close();
            reject(error);
          }
        } else if (event.data.type === 'oauth_error' || event.data.type === 'sso_auth_error') {
          console.error(`[OAuth] OAuth error received:`, event.data.error);
          window.removeEventListener('message', messageHandler);
          popup.close();
          reject(new Error(event.data.error));
        } else {
          console.log(`[OAuth] Ignoring unrecognized message:`, event.data);
        }
      };

      console.log(`[OAuth] Adding message event listener for ${provider}`);
      window.addEventListener('message', messageHandler);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log(`[OAuth] Popup was closed manually for ${provider}`);
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          reject(new Error('Authentication cancelled'));
        }
      }, 1000);
      
      // Add timeout protection
      setTimeout(() => {
        if (!popup.closed) {
          console.warn(`[OAuth] Authentication timeout for ${provider} (2 minutes)`);
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          reject(new Error('Authentication timeout - please try again'));
        }
      }, 120000); // 2 minute timeout
    });
  } catch (error) {
    console.error(`[OAuth] Failed to generate auth URL for ${provider}:`, error);
    throw new Error(`Failed to generate auth URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default SimplifiedOAuthManager;