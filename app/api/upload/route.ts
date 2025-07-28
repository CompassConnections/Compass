import {NextResponse} from 'next/server';
import {getSession} from '@/lib/auth';
import {v4 as uuidv4} from 'uuid';
import {GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({error: 'Not authenticated'}, {status: 401});
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({error: 'No file provided'}, {status: 400});
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({error: 'Only image files are allowed'}, {status: 400});
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({error: 'File size must be less than 5MB'}, {status: 400});
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fileBuffer = await file.arrayBuffer();
    const key = `profile-pictures/${fileName}`;

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
    };

    const response = await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`Response: ${response}`);

    // get signed url
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
      }),
      {expiresIn: 300} // 5 minutes
    );

    console.log(`Signed URL: ${url}`);
    // const fileUrl = `${process.env.AWS_S3_BUCKET_NAME}/profile-pictures/${fileName}`;

    return NextResponse.json({url: url, key: key});
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {error: 'Failed to upload file'},
      {status: 500}
    );
  }
}
