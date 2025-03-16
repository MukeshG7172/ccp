import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import prisma from "../../lib/prisma";

export async function POST(req) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get email from request body
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if institution with this email already exists
    let institution = await prisma.institution.findUnique({
      where: {
        email: email,
      },
    });

    // If institution doesn't exist, create it
    if (!institution) {
      institution = await prisma.institution.create({
        data: {
          email: email,
        },
      });
    }

    // Return success response with institution details
    return NextResponse.json({ 
      success: true, 
      isNew: !institution,
      institutionId: institution.id 
    });
    
  } catch (error) {
    console.error("Institution check error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized", isInstitution: false },
        { status: 401 }
      );
    }

    // Check if email exists in Institution table
    const institution = await prisma.institution.findUnique({
      where: {
        email: session.user.email,
      },
    });

    // Return whether the user is part of an institution
    return NextResponse.json({
      isInstitution: !!institution,
      institutionId: institution?.id || null,
    });
    
  } catch (error) {
    console.error("Institution check error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", isInstitution: false },
      { status: 500 }
    );
  }
}