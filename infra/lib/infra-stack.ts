// ==========================================
// JARVIS — AWS CDK Infrastructure Stack
// Defines all AWS resources for the serverless voice assistant
// ==========================================

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as path from 'path';
import { Construct } from 'constructs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================
    // S3 — Audio Storage
    // ============================
    const audioBucket = new s3.Bucket(this, 'JarvisAudioBucket', {
      bucketName: `jarvis-audio-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
          prefix: 'audio/',
        },
        {
          expiration: cdk.Duration.days(7),
          prefix: 'transcripts/',
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // ============================
    // DynamoDB — Tables
    // ============================
    const tasksTable = new dynamodb.Table(this, 'JarvisTasksTable', {
      tableName: 'JarvisTasks',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    const memosTable = new dynamodb.Table(this, 'JarvisMemosTable', {
      tableName: 'JarvisMemos',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'memoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const pushTokensTable = new dynamodb.Table(this, 'JarvisPushTokensTable', {
      tableName: 'JarvisPushTokens',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'token', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ============================
    // Cognito — Authentication
    // ============================
    const userPool = new cognito.UserPool(this, 'JarvisUserPool', {
      userPoolName: 'jarvis-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'JarvisAppClient', {
      userPool,
      userPoolClientName: 'jarvis-mobile-app',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    const identityPool = new cognito.CfnIdentityPool(this, 'JarvisIdentityPool', {
      identityPoolName: 'jarvis_identity_pool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    // IAM role for authenticated users (for S3 direct upload)
    const authenticatedRole = new iam.Role(this, 'CognitoAuthRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    // Allow authenticated users to upload to their own prefix in S3
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject'],
        resources: [`${audioBucket.bucketArn}/audio/\${cognito-identity.amazonaws.com:sub}/*`],
      })
    );

    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoles', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
      },
    });

    // ============================
    // EventBridge Scheduler Group
    // ============================
    const schedulerGroup = new scheduler.CfnScheduleGroup(this, 'JarvisSchedulerGroup', {
      name: 'jarvis-schedules',
    });

    // ============================
    // Lambda — Common environment vars
    // ============================
    const lambdaEnvironment = {
      TASKS_TABLE: tasksTable.tableName,
      MEMOS_TABLE: memosTable.tableName,
      PUSH_TOKENS_TABLE: pushTokensTable.tableName,
      AUDIO_BUCKET: audioBucket.bucketName,
      SCHEDULER_GROUP: 'jarvis-schedules',
      BEDROCK_MODEL_ID: 'meta.llama3-8b-instruct-v1:0',
    };

    const lambdasDir = path.join(__dirname, '..', '..', 'lambdas');
    const projectRoot = path.join(__dirname, '..', '..');
    const depsLockFilePath = path.join(__dirname, '..', 'package-lock.json');

    const commonBundling: lambdaNode.BundlingOptions = {
      externalModules: ['@aws-sdk/*'],
      minify: true,
      sourceMap: true,
    };

    // ============================
    // Lambda — Notification Sender (defined first for ARN reference)
    // ============================
    const notificationSenderFn = new lambdaNode.NodejsFunction(this, 'NotificationSenderFn', {
      functionName: 'jarvis-notification-sender',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(lambdasDir, 'notification-sender', 'index.ts'),
      projectRoot,
      depsLockFilePath,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnvironment,
      bundling: commonBundling,
    });

    pushTokensTable.grantReadData(notificationSenderFn);
    tasksTable.grantReadWriteData(notificationSenderFn);

    // IAM role for EventBridge Scheduler to invoke notification Lambda
    const schedulerRole = new iam.Role(this, 'SchedulerRole', {
      roleName: 'jarvis-scheduler-role',
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
    });

    schedulerRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['lambda:InvokeFunction'],
        resources: [notificationSenderFn.functionArn],
      })
    );

    // ============================
    // Lambda — Memo Upload
    // ============================
    const memoUploadFn = new lambdaNode.NodejsFunction(this, 'MemoUploadFn', {
      functionName: 'jarvis-memo-upload',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(lambdasDir, 'memo-upload', 'index.ts'),
      projectRoot,
      depsLockFilePath,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: lambdaEnvironment,
      bundling: commonBundling,
    });

    audioBucket.grantPut(memoUploadFn);
    memosTable.grantWriteData(memoUploadFn);

    // ============================
    // Lambda — Memo Processor
    // ============================
    const memoProcessorFn = new lambdaNode.NodejsFunction(this, 'MemoProcessorFn', {
      functionName: 'jarvis-memo-processor',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(lambdasDir, 'memo-processor', 'index.ts'),
      projectRoot,
      depsLockFilePath,
      timeout: cdk.Duration.minutes(10), // Transcription can take time
      memorySize: 512,
      environment: {
        ...lambdaEnvironment,
        NOTIFICATION_LAMBDA_ARN: notificationSenderFn.functionArn,
        SCHEDULER_ROLE_ARN: schedulerRole.roleArn,
      },
      bundling: commonBundling,
    });

    audioBucket.grantRead(memoProcessorFn);
    memosTable.grantReadWriteData(memoProcessorFn);
    tasksTable.grantWriteData(memoProcessorFn);

    // Transcribe permissions
    memoProcessorFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'transcribe:StartTranscriptionJob',
          'transcribe:GetTranscriptionJob',
        ],
        resources: ['*'],
      })
    );

    // Transcribe needs read/write access to S3 for input and output
    audioBucket.grantReadWrite(memoProcessorFn);

    // Bedrock permissions
    memoProcessorFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:*::foundation-model/*`,
          `arn:aws:bedrock:*:${this.account}:inference-profile/*`,
        ],
      })
    );

    // EventBridge Scheduler permissions
    memoProcessorFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['scheduler:CreateSchedule'],
        resources: [`arn:aws:scheduler:${this.region}:${this.account}:schedule/jarvis-schedules/*`],
      })
    );

    memoProcessorFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [schedulerRole.roleArn],
      })
    );

    // S3 event notification → trigger memo processor
    audioBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(memoProcessorFn),
      { prefix: 'audio/' }
    );

    // ============================
    // Lambda — Task Manager
    // ============================
    const taskManagerFn = new lambdaNode.NodejsFunction(this, 'TaskManagerFn', {
      functionName: 'jarvis-task-manager',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(lambdasDir, 'task-manager', 'index.ts'),
      projectRoot,
      depsLockFilePath,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      environment: lambdaEnvironment,
      bundling: commonBundling,
    });

    tasksTable.grantReadWriteData(taskManagerFn);
    memosTable.grantReadData(taskManagerFn);

    // Allow deleting EventBridge schedules
    taskManagerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['scheduler:DeleteSchedule'],
        resources: [`arn:aws:scheduler:${this.region}:${this.account}:schedule/jarvis-schedules/*`],
      })
    );

    // ============================
    // Lambda — Push Token Manager
    // ============================
    const pushTokenManagerFn = new lambdaNode.NodejsFunction(this, 'PushTokenManagerFn', {
      functionName: 'jarvis-push-token-manager',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(lambdasDir, 'push-token-manager', 'index.ts'),
      projectRoot,
      depsLockFilePath,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: lambdaEnvironment,
      bundling: commonBundling,
    });

    pushTokensTable.grantReadWriteData(pushTokenManagerFn);

    // ============================
    // API Gateway
    // ============================
    const api = new apigateway.RestApi(this, 'JarvisApi', {
      restApiName: 'JARVIS API',
      description: 'JARVIS Voice Assistant API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Cognito authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'JarvisAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'jarvis-cognito-authorizer',
    });

    const authOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // POST /memo
    const memoResource = api.root.addResource('memo');
    memoResource.addMethod('POST', new apigateway.LambdaIntegration(memoUploadFn), authOptions);

    // GET /memo/{memoId}/status
    const memoIdResource = memoResource.addResource('{memoId}');
    const memoStatusResource = memoIdResource.addResource('status');
    memoStatusResource.addMethod('GET', new apigateway.LambdaIntegration(taskManagerFn), authOptions);

    // POST /memo/{memoId}/analyze
    const memoAnalyzeResource = memoIdResource.addResource('analyze');
    memoAnalyzeResource.addMethod('POST', new apigateway.LambdaIntegration(memoProcessorFn), authOptions);

    // /tasks
    const tasksResource = api.root.addResource('tasks');
    tasksResource.addMethod('GET', new apigateway.LambdaIntegration(taskManagerFn), authOptions);
    tasksResource.addMethod('POST', new apigateway.LambdaIntegration(taskManagerFn), authOptions);

    // /tasks/{taskId}
    const taskIdResource = tasksResource.addResource('{taskId}');
    taskIdResource.addMethod('PUT', new apigateway.LambdaIntegration(taskManagerFn), authOptions);
    taskIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(taskManagerFn), authOptions);

    // /push-token
    const pushTokenResource = api.root.addResource('push-token');
    pushTokenResource.addMethod('POST', new apigateway.LambdaIntegration(pushTokenManagerFn), authOptions);
    pushTokenResource.addMethod('GET', new apigateway.LambdaIntegration(pushTokenManagerFn), authOptions);
    pushTokenResource.addMethod('DELETE', new apigateway.LambdaIntegration(pushTokenManagerFn), authOptions);

    // ============================
    // Outputs
    // ============================
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito App Client ID',
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref,
      description: 'Cognito Identity Pool ID',
    });

    new cdk.CfnOutput(this, 'AudioBucketName', {
      value: audioBucket.bucketName,
      description: 'S3 Audio Bucket Name',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
    });
  }
}
