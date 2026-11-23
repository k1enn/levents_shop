import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchGetCommand, DynamoDBDocumentClient, GetCommand, QueryCommand, type QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { env } from "./env.server";

// 1 table, keys PK + SK, GSI1 (user orders), GSI2 (all orders). Layout in plans/261123-aws-dynamodb/phase-02.
export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });
export const TABLE = env.TABLE;

export type Key = { PK: string; SK: string };
export const now = () => new Date().toISOString();

export async function get<T>(PK: string, SK: string) {
  const r = await ddb.send(new GetCommand({ TableName: TABLE, Key: { PK, SK }, ConsistentRead: true }));
  return r.Item as T | undefined;
}

// shortcut: retries UnprocessedKeys without backoff, fine at demo traffic.
export async function batchGet<T>(keys: Key[]) {
  const out: T[] = [];
  for (let i = 0; i < keys.length; i += 100) {
    let Keys: Record<string, unknown>[] = keys.slice(i, i + 100);
    while (Keys.length) {
      const r = await ddb.send(new BatchGetCommand({ RequestItems: { [TABLE]: { Keys, ConsistentRead: true } } }));
      out.push(...((r.Responses?.[TABLE] ?? []) as T[]));
      Keys = r.UnprocessedKeys?.[TABLE]?.Keys ?? [];
    }
  }
  return out;
}

export async function queryAll<T>(p: Omit<QueryCommandInput, "TableName">) {
  const out: T[] = [];
  let ExclusiveStartKey: QueryCommandInput["ExclusiveStartKey"];
  do {
    const r = await ddb.send(new QueryCommand({ ...p, TableName: TABLE, ExclusiveStartKey }));
    out.push(...((r.Items ?? []) as T[]));
    ExclusiveStartKey = r.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return out;
}

// Whole partition, strongly consistent (base table only).
export const queryPk = <T>(pk: string) =>
  queryAll<T>({ KeyConditionExpression: "PK = :pk", ExpressionAttributeValues: { ":pk": pk }, ConsistentRead: true });

export const isCondFail = (e: unknown) => (e as Error).name === "ConditionalCheckFailedException" || (e as Error).name === "TransactionCanceledException";

// Per item reason codes of a cancelled transaction ("None", "ConditionalCheckFailed", "TransactionConflict"...), or null.
export const cancelCodes = (e: unknown) =>
  (e as Error).name === "TransactionCanceledException"
    ? ((e as { CancellationReasons?: { Code?: string }[] }).CancellationReasons ?? []).map((r) => r.Code ?? "None")
    : null;
