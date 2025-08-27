import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  req: Request
) {
  // console.log(req)

  const {searchParams} = new URL(req.url);
  const key = searchParams.get('key'); // get the key from query params

  if (!key) {
    return new Response('S3 download error', {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    });
  }

  try {
    // Option 1: Generate a signed URL (client downloads directly from S3)
    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
      }),
      {expiresIn: 300} // 5 minutes
    );

    return new Response(JSON.stringify({url: signedUrl}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    });

  } catch (err) {
    console.error("S3 download error:", err);
    return new Response('S3 download error', {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    });
  }
}
