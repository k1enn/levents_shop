import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, now, TABLE } from "./db.server";
import type { LEAD_STATUSES } from "./shop";

export type Lead = {
  _id: string; // also the SK: <createdAt>#<uuid>, so the partition sorts by time
  type: "installment" | "tradein";
  fullName: string;
  phone: string;
  payload: Record<string, string | number>;
  status: (typeof LEAD_STATUSES)[number];
  createdAt: string;
};
const LEAD = "LEAD";

export async function createLead(l: Pick<Lead, "type" | "fullName" | "phone" | "payload">) {
  const createdAt = now();
  const _id = `${createdAt}#${crypto.randomUUID()}`;
  await ddb.send(new PutCommand({ TableName: TABLE, Item: { PK: LEAD, SK: _id, _id, ...l, status: "new", createdAt } }));
}

export async function listLeads() {
  const r = await ddb.send(new QueryCommand({ TableName: TABLE, KeyConditionExpression: "PK = :pk", ExpressionAttributeValues: { ":pk": LEAD }, ScanIndexForward: false, Limit: 200 }));
  return (r.Items ?? []) as Lead[];
}

export const setLeadStatus = (id: string, status: Lead["status"]) =>
  ddb
    .send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: LEAD, SK: id },
        UpdateExpression: "SET #s = :s",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": status },
      }),
    )
    .catch((e) => {
      if ((e as Error).name !== "ConditionalCheckFailedException") throw e;
    });
