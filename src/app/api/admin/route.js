import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import prisma from "../../lib/prisma";

export async function GET(req) {
  try {
   
    const session = await getServerSession(authOptions);

    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized", isAdmin: false },
        { status: 401 }
      );
    }

    
    const admin = await prisma.admin.findUnique({
      where: {
        email: session.user.email,
      },
    });

   
    return NextResponse.json({
      isAdmin: !!admin,
    });
  } catch (error) {
    console.error("Admin check error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", isAdmin: false },
      { status: 500 }
    );
  }
}