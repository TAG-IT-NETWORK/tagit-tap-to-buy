import type { Request, Response } from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.DDB_TABLE ?? 'tagit-tap-to-buy-metadata';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' }));

export async function resolveChip(req: Request, res: Response) {
  const chipId = String(req.query.chipId ?? '');
  if (!chipId || !/^[a-zA-Z0-9_-]{1,64}$/.test(chipId)) {
    return res.status(400).json({ error: 'invalid chipId' });
  }

  try {
    const r = await ddb.send(new GetCommand({ TableName: TABLE, Key: { chipId } }));
    if (!r.Item) return res.json(null);
    const { nft, tokenId } = r.Item as { nft: string; tokenId: number | string };
    return res.json({ nft, tokenId: String(tokenId) });
  } catch (e) {
    return res.status(502).json({ error: 'lookup failed', detail: String(e) });
  }
}
