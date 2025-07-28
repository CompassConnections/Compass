import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { VerificationEmail } from "@/emails/VerificationEmail";
import { v4 as uuidv4 } from 'uuid';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to generate a verification token
const generateVerificationToken = () => {
  return uuidv4();
};

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24); // Token expires in 24 hours

    // Create user with verification token
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        name,
        emailVerified: null, // Will be set when email is verified
        verificationToken,
        verificationTokenExpires,
      },
    });

    // Send verification email. TODO once we have a domain
    // You can only send testing emails to your own email address.
    // To send emails to other recipients, please verify a domain at resend.com/domains,
    // and change the `from` address to an email using this domain.
    // const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`;
    // const emailHtml = await render(VerificationEmail({ url: verificationUrl }));
    // try {
    //   let payload = {
    //     from: `BayesBond <${process.env.EMAIL_FROM!}>`,
    //     to: email,
    //     subject: 'Verify your email',
    //     html: emailHtml,
    //   };
    //   console.log(`Verification email: ${payload}`);
    //   await resend.emails.send(payload);
    // } catch (emailError) {
    //   console.error('Failed to send verification email:', emailError);
    // }

    return NextResponse.json({ 
      message: "User created. Please check your email to verify your account.", 
      userId: user.id 
    }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
