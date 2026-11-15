const FLOCI_URL = process.env.FLOCI_URL || 'http://localhost:4566'

export const Config = {
  FLOCI_URL,
  AUTH_MODE: process.env.AUTH_MODE || 'static',
  ADMIN_USER: process.env.ADMIN_USER || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin123!',
  BFF_JWT_SECRET: process.env.BFF_JWT_SECRET || 'sdcc-bff-dev-secret',
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || 'eu-south-1_test',
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || 'test',
  API_PREDICI_URL:
    process.env.API_PREDICI_URL || `${FLOCI_URL}/restapis/sdcc-api/local/_user_request_/predici`,
  AWS_REGION: 'eu-south-1',
  AWS_CREDS: { accessKeyId: 'test', secretAccessKey: 'test' },
}
