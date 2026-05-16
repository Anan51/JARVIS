// ==========================================
// JARVIS — DynamoDB Helper Utilities
// ==========================================

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  DeleteItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});

const TASKS_TABLE = process.env.TASKS_TABLE!;
const MEMOS_TABLE = process.env.MEMOS_TABLE!;
const PUSH_TOKENS_TABLE = process.env.PUSH_TOKENS_TABLE!;

// ---- Generic Helpers ----

export async function putItem(tableName: string, item: Record<string, unknown>): Promise<void> {
  await client.send(
    new PutItemCommand({
      TableName: tableName,
      Item: marshall(item, { removeUndefinedValues: true }),
    })
  );
}

export async function getItem(
  tableName: string,
  key: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  const result = await client.send(
    new GetItemCommand({
      TableName: tableName,
      Key: marshall(key),
    })
  );
  return result.Item ? unmarshall(result.Item) : null;
}

export async function queryItems(
  tableName: string,
  keyCondition: string,
  expressionValues: Record<string, unknown>,
  indexName?: string
): Promise<Record<string, unknown>[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: marshall(expressionValues),
    })
  );
  return (result.Items ?? []).map((item) => unmarshall(item));
}

export async function deleteItem(
  tableName: string,
  key: Record<string, unknown>
): Promise<void> {
  await client.send(
    new DeleteItemCommand({
      TableName: tableName,
      Key: marshall(key),
    })
  );
}

export async function updateItemStatus(
  tableName: string,
  key: Record<string, unknown>,
  status: string
): Promise<void> {
  await client.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: marshall(key),
      UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: marshall({
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      }),
    })
  );
}

// ---- Task Operations ----

export async function createTask(task: Record<string, unknown>): Promise<void> {
  await putItem(TASKS_TABLE, task);
}

export async function getTask(
  userId: string,
  taskId: string
): Promise<Record<string, unknown> | null> {
  return getItem(TASKS_TABLE, { userId, taskId });
}

export async function getUserTasks(userId: string): Promise<Record<string, unknown>[]> {
  return queryItems(TASKS_TABLE, 'userId = :userId', { ':userId': userId });
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  await deleteItem(TASKS_TABLE, { userId, taskId });
}

export async function updateTaskStatus(
  userId: string,
  taskId: string,
  status: string
): Promise<void> {
  await updateItemStatus(TASKS_TABLE, { userId, taskId }, status);
}

// ---- Memo Operations ----

export async function createMemo(memo: Record<string, unknown>): Promise<void> {
  await putItem(MEMOS_TABLE, memo);
}

export async function getMemo(
  userId: string,
  memoId: string
): Promise<Record<string, unknown> | null> {
  return getItem(MEMOS_TABLE, { userId, memoId });
}

export async function updateMemo(
  userId: string,
  memoId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const expressionParts: string[] = [];
  const expressionNames: Record<string, string> = {};
  const expressionValues: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value], index) => {
    const nameKey = `#field${index}`;
    const valueKey = `:val${index}`;
    expressionParts.push(`${nameKey} = ${valueKey}`);
    expressionNames[nameKey] = key;
    expressionValues[valueKey] = value;
  });

  expressionParts.push('#updatedAt = :updatedAt');
  expressionNames['#updatedAt'] = 'updatedAt';
  expressionValues[':updatedAt'] = new Date().toISOString();

  await client.send(
    new UpdateItemCommand({
      TableName: MEMOS_TABLE,
      Key: marshall({ userId, memoId }),
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: marshall(expressionValues, { removeUndefinedValues: true }),
    })
  );
}

// ---- Push Token Operations ----

export async function savePushToken(token: Record<string, unknown>): Promise<void> {
  await putItem(PUSH_TOKENS_TABLE, token);
}

export async function getUserPushTokens(userId: string): Promise<Record<string, unknown>[]> {
  return queryItems(PUSH_TOKENS_TABLE, 'userId = :userId', { ':userId': userId });
}

export async function deletePushToken(userId: string, token: string): Promise<void> {
  await deleteItem(PUSH_TOKENS_TABLE, { userId, token });
}
