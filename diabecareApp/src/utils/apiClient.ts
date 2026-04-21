/**
 * diabecareApp/src/utils/apiClient.ts
 *
 * Re-export the configured axios instance from api.ts so screens can import
 * it directly without duplicating the interceptor setup.
 *
 * Usage:
 *   import apiClient from './apiClient';
 *   const res = await apiClient.get('/medical-records');
 */
import apiClient from './api'; // the named export isn't exposed, so we grab the default

// api.ts doesn't export the instance directly – add this single line at the
// BOTTOM of api.ts instead:
//   export default apiClient;
//
// Then import in HomeScreen as:
//   import apiClient from '../utils/api';

export default apiClient;
