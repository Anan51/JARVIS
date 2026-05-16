# JARVIS — AI Voice Assistant

A serverless, AI-powered voice assistant mobile app built with React Native (Expo) and AWS. Record voice memos to set alarms, create reminders, send texts, and manage tasks — all hands-free.

## Features

- **🎙️ Voice Recording** — Record voice memos that are automatically transcribed and analyzed
- **⏰ Smart Alarms** — "Set an alarm for 7am" → schedules a device notification
- **📌 Reminders** — "Remind me to finish the report by 5pm" → creates a timed reminder
- **💬 SMS Messages** — "Text Mom that I'll be late" → opens native SMS with pre-filled message
- **✅ Task Lists** — "Add buy groceries to my list" → creates and tracks tasks
- **🔔 Push Notifications** — Remote notifications for reminders via Expo Push
- **🔐 Authentication** — Secure sign-up/sign-in with AWS Cognito
- **☁️ Fully Serverless** — Zero servers to manage, pay only for what you use

## Architecture

| Layer | Technology |
|-------|-----------|
| **Mobile App** | React Native + Expo + TypeScript |
| **Auth** | AWS Cognito (User Pool + Identity Pool) |
| **API** | AWS API Gateway + Lambda |
| **Speech → Text** | Amazon Transcribe |
| **AI Analysis** | Amazon Bedrock (Claude 3.5 Sonnet) |
| **Storage** | S3 (audio) + DynamoDB (tasks) |
| **Scheduling** | EventBridge Scheduler |
| **Notifications** | Expo Push + Local Notifications |
| **SMS** | Native device SMS via expo-sms |
| **Infrastructure** | AWS CDK v2 (TypeScript) |

## Prerequisites

- **Node.js** 20+ and npm
- **AWS CLI** configured with credentials (`aws configure`)
- **AWS CDK** (`npm install -g aws-cdk`)
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (macOS) or **Android Emulator** or a physical device
- **Amazon Bedrock** — Claude 3.5 Sonnet model access enabled in us-east-1

## Quick Start

### 1. Configure AWS

```bash
# Configure AWS CLI with your credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output (json)

# Bootstrap CDK (one-time setup)
cd infra && npx cdk bootstrap
```

### 2. Deploy Backend

```bash
cd infra
npx cdk deploy

# Note the outputs:
# ApiUrl, UserPoolId, UserPoolClientId, IdentityPoolId, AudioBucketName
```

### 3. Configure Mobile App

```bash
cd app
cp .env.example .env
# Edit .env with the CDK output values
```

### 4. Run the App

```bash
cd app
npx expo start

# Then press:
# i — open iOS Simulator
# a — open Android Emulator
# Scan QR code — open on physical device with Expo Go
```

## Project Structure

```
JARVIS/
├── app/                    # React Native (Expo) mobile app
│   ├── app/               # Expo Router screens
│   │   ├── (auth)/        # Login, signup, verification
│   │   └── (tabs)/        # Main app tabs (Record, Tasks, Settings)
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client, auth, SMS
│   ├── constants/         # Theme, config
│   └── types/             # TypeScript interfaces
├── lambdas/               # AWS Lambda function source code
│   ├── memo-upload/       # Presigned URL generation
│   ├── memo-processor/    # Transcribe + Bedrock pipeline
│   ├── task-manager/      # Task CRUD
│   ├── notification-sender/ # Push notification delivery
│   ├── push-token-manager/  # Device token storage
│   └── shared/            # Shared types, DB helpers, Bedrock client
├── infra/                 # AWS CDK infrastructure
│   ├── lib/infra-stack.ts # All AWS resources
│   └── bin/infra.ts       # CDK app entry point
└── README.md
```

## How It Works

1. **Record** — User records a voice memo in the app
2. **Upload** — Audio is uploaded directly to S3 via presigned URL
3. **Transcribe** — S3 event triggers Lambda → Amazon Transcribe converts speech to text
4. **Analyze** — Transcript is sent to Bedrock (Claude 3.5 Sonnet) for intent extraction
5. **Execute** — For each detected intent:
   - **Alarm**: Schedules a local device notification
   - **Reminder**: Schedules EventBridge → Lambda → Expo Push notification
   - **Message**: Opens native SMS composer with pre-filled recipient and body
   - **Task**: Stored in DynamoDB and displayed in the Tasks tab
6. **Notify** — At scheduled times, EventBridge triggers Lambda to send push notifications

## Cost Estimate (Low Volume)

| Service | Estimated Monthly Cost |
|---------|----------------------|
| Lambda | Free tier (1M requests/month) |
| DynamoDB | Free tier (25 GB, 25 RCU/WCU) |
| S3 | ~$0.02 (for audio files) |
| API Gateway | Free tier (1M calls/month) |
| Transcribe | ~$0.72 (30 min of audio) |
| Bedrock | ~$0.50 (modest usage) |
| EventBridge Scheduler | Free tier (14M invocations) |
| **Total** | **~$1.25/month** |

## License

MIT
