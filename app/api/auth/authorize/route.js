import { NextResponse } from 'next/server';
import { getClient } from '../../../../config/clients';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    const responseType = url.searchParams.get('response_type');
    const state = url.searchParams.get('state');
    
    console.log("Auth request received:", { clientId, redirectUri, responseType, state });
    
    // Validate client_id
    if (!clientId) {
      return NextResponse.redirect(new URL(`/auth/error?error=invalid_request&error_description=${encodeURIComponent('Missing client_id parameter')}`));
    }
    
    const client = getClient(clientId);
    if (!client || !client.active) {
      console.log(`Invalid client ID: ${clientId}`);
      return NextResponse.redirect(new URL(`/auth/error?error=invalid_client&error_description=${encodeURIComponent('Invalid client')}`));
    }
    
    // Validate redirect_uri
    if (!redirectUri) {
      return NextResponse.redirect(new URL(`/auth/error?error=invalid_request&error_description=${encodeURIComponent('Missing redirect_uri parameter')}`));
    }
    
    if (!client.redirectUris.includes(redirectUri)) {
      console.log(`Invalid redirect URI: ${redirectUri}`);
      return NextResponse.redirect(new URL(`/auth/error?error=invalid_request&error_description=${encodeURIComponent('Redirect URI not allowed for this client')}`));
    }
    
    // Validate response_type
    if (responseType !== 'code') {
      return NextResponse.redirect(new URL(`/auth/error?error=unsupported_response_type&error_description=${encodeURIComponent('Only code response type is supported')}`));
    }
    
    // Build the login URL, including all parameters
    const loginUrl = new URL('/auth', url.origin);
    loginUrl.searchParams.set('client_id', clientId);
    loginUrl.searchParams.set('redirect_uri', redirectUri);
    loginUrl.searchParams.set('response_type', responseType);
    if (state) {
      loginUrl.searchParams.set('state', state);
    }
    
    console.log("Redirecting to login page:", loginUrl.toString());
    return NextResponse.redirect(loginUrl);
    
  } catch (error) {
    console.error("Error in auth/authorize:", error.message);
    return NextResponse.redirect(new URL(`/auth/error?error=server_error&error_description=${encodeURIComponent('Internal server error')}`));
  }
}