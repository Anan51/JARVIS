// ==========================================
// JARVIS — API Configuration
// ==========================================

// These values are populated after CDK deployment.
// Run `npm run config` to auto-populate from CloudFormation outputs.
export const config = {
  // API Gateway endpoint
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod',

  // Cognito
  cognitoRegion: process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1',
  cognitoUserPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID || 'YOUR_USER_POOL_ID',
  cognitoUserPoolClientId: process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID || 'YOUR_CLIENT_ID',
  cognitoIdentityPoolId: process.env.EXPO_PUBLIC_IDENTITY_POOL_ID || 'YOUR_IDENTITY_POOL_ID',

  // S3
  audioBucket: process.env.EXPO_PUBLIC_AUDIO_BUCKET || 'YOUR_BUCKET_NAME',
  awsRegion: process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1',

  // Polling
  memoStatusPollIntervalMs: 3000,
  memoStatusMaxPollAttempts: 100,
};
