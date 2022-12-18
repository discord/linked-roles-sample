import crypto from 'crypto';
import fetch from 'node-fetch';

import * as storage from './storage.js';
import config from './config.js';

/**
 * Code specific to communicating with the Discord API.
 */

/**
 * The following methods all facilitate OAuth2 communication with Discord.
 * See https://discord.com/developers/docs/topics/oauth2 for more details.
 */

/**
 * Generate the url which the user will be directed to in order to approve the
 * bot, and see the list of requested scopes.
 */

export function getOAuthUrl() {
  const state = crypto.randomUUID();

  const url = new URL('https://discord.com/api/oauth2/authorize');
  url.searchParams.set('client_id', config.DISCORD_CLIENT_ID);
  url.searchParams.set('redirect_uri', config.DISCORD_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'role_connections.write identify');
  url.searchParams.set('prompt', 'consent');
  return { state, url: url.toString() };
}

/**
 * Given an OAuth2 code from the scope approval page, make a request to Discord's
 * OAuth2 service to retrieve an access token, refresh token, and expiration.
 */
export async function getOAuthTokens(code) {
  try {
    // Make a request to Discord's OAuth2 service to retrieve an access token,
    const url = 'https://discord.com/api/v10/oauth2/token';
    const body = new URLSearchParams({
      client_id: config.DISCORD_CLIENT_ID,
      client_secret: config.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.DISCORD_REDIRECT_URI,
    });

    const response = await fetch(url, {
      body,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.ok){
      const data = await response.json();
      return data; 
    }
    else{
      console.error('Error getting OAuth tokens');
      return null;
    }
  } catch (error) {
    throw new Error(`Error fetching OAuth tokens: [${response.status}] ${response.statusText}`);
  }
}

/**
 * The initial token request comes with both an access token and a refresh
 * token.  Check if the access token has expired, and if it has, use the
 * refresh token to acquire a new, fresh access token.
 */
export async function getAccessToken(userId, tokens) {
  try {
    //const { refresh_token, expires_in } = tokens;
    if (Date.now() > tokens.expires_at) {
      // The access token has expired, so use the refresh token to get a new one.
      const url = 'https://discord.com/api/v10/oauth2/token';
      const body = new URLSearchParams({
        client_id: config.DISCORD_CLIENT_ID,
        client_secret: config.DISCORD_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
      });
    
      const response = await fetch(url, {
        body,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    
      if (response.ok){
        const tokens = await response.json();
        tokens.access_token = tokens.access_token;
        tokens.expires_at = Date.now() + tokens.expires_in * 1000;
        await storage.storeDiscordTokens(userId, tokens);
        return tokens.access_token;
      } else{
        throw new Error(`Error refreshing access token: [${response.status}] ${response.statusText}`);
     }
    }
    return tokens.access_token;
  } catch (error) {
    throw new Error(`Error refreshing access token: [${response.status}] ${response.statusText}`);
  }

}

/**
 * Given a user based access token, fetch profile information for the current user.
 */
export async function getUserData(tokens) {
  try {
    const url = 'https://discord.com/api/v10/oauth2/@me';
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error(`Error fetching user data: [${response.status}] ${response.statusText}`);
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * Given metadata that matches the schema, push that data to Discord on behalf
 * of the current user.
 */
export async function pushMetadata(userId, tokens, metadata) {
  // GET/PUT /users/@me/applications/:id/role-connection
  try {
    const url = `https://discord.com/api/v10/users/@me/applications/${config.DISCORD_CLIENT_ID}/role-connection`;
    const accessToken = await getAccessToken(userId, tokens);
    const body = {
      platform_name: 'Example Linked Role Discord Bot',
      metadata,
    };
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      return true;
    } else {
      throw new Error(`Error pushing metadata: [${response.status}] ${response.statusText}`);
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * Fetch the metadata currently pushed to Discord for the currently logged
 * in user, for this specific bot.
 */
export async function getMetadata(userId, tokens) {
  // GET/PUT /users/@me/applications/:id/role-connection
  try {
    const url = `https://discord.com/api/v10/users/@me/applications/${config.DISCORD_CLIENT_ID}/role-connection`;
    const accessToken = await getAccessToken(userId, tokens);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error(`Error fetching discord metadata: [${response.status}] ${response.statusText}`);
    }
  } catch (error) {
      console.error(error);
  }
}
