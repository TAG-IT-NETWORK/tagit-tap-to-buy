/**
 * Seeds the demo asset (VT PDRN Capsule Cream) into DynamoDB and uploads
 * the photo to S3. Run after creating the DDB table + S3 bucket via the
 * AWS console (table key: chipId, bucket public-read or via CloudFront).
 *
 * Usage:
 *   AWS_REGION=us-east-1 \
 *   DDB_TABLE=tagit-tap-to-buy-metadata \
 *   S3_BUCKET=tagit-tap-to-buy-photos \
 *   DEMO_NFT=0x... DEMO_TOKEN_ID=18 \
 *   DEMO_OWNER=0x458B... \
 *   PHOTO_PATH=./vt-cream.jpg \
 *   tsx infra/seed-demo.ts
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'node:fs';

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const TABLE = process.env.DDB_TABLE ?? 'tagit-tap-to-buy-metadata';
const BUCKET = process.env.S3_BUCKET ?? 'tagit-tap-to-buy-photos';

const NFT = process.env.DEMO_NFT ?? '0x0000000000000000000000000000000000000000';
const TOKEN_ID = Number(process.env.DEMO_TOKEN_ID ?? 18);
const OWNER = process.env.DEMO_OWNER ?? '0x0000000000000000000000000000000000000000';
const CHIP_ID = process.env.DEMO_CHIP_ID ?? 'vt-cream-001';
const PHOTO_PATH = process.env.PHOTO_PATH;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const s3 = new S3Client({ region: REGION });

async function main() {
  let photoKey = `chips/${CHIP_ID}.jpg`;
  if (PHOTO_PATH) {
    const body = readFileSync(PHOTO_PATH);
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: photoKey,
        Body: body,
        ContentType: 'image/jpeg',
      }),
    );
    console.log(`uploaded photo to s3://${BUCKET}/${photoKey}`);
  }

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        chipId: CHIP_ID,
        nft: NFT,
        tokenId: TOKEN_ID,
        productName: 'VT PDRN Capsule Cream — 50ml',
        msrp: '$45',
        description:
          'Korean polynucleotide skincare. PDRN-rich repair cream. NFC-bound to a Base Sepolia ERC-721 digital twin via TAG IT NETWORK SUN protocol.',
        custodyHistory: [{ address: OWNER, ts: Math.floor(Date.now() / 1000) }],
        scanCount: 1,
        recallFlags: [],
        photoKey,
      },
    }),
  );
  console.log(`seeded chip ${CHIP_ID} → ${NFT}#${TOKEN_ID} owned by ${OWNER}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
