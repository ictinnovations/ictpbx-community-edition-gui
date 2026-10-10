/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
export const environment = {
  production: true,
  API_URL: '/api',
  // WS_URL: 'ws://ip_address:8090' format for non-ssl ip-address
  // WS_URL: 'wss://domain/wss/:8080' format for ssl domain
  // WS_URL: '' empty format for build or deploy to server
  WS_URL: '',
  COMMUNITY_EDITION: false,
};
