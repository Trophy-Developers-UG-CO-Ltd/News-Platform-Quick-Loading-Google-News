// gscClient.js
// Google Search Console API client setup
const { google } = require('googleapis');

function getGSCClient() {
  // These values should be set in environment variables for security
  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;
  const redirectUri = process.env.GSC_REDIRECT_URI;
  const refreshToken = process.env.GSC_REFRESH_TOKEN;

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.searchconsole({ version: 'v1', auth: oauth2Client });
}

module.exports = getGSCClient;
