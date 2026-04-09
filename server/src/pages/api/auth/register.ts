import { NextApiRequest, NextApiResponse } from "next";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, email, phone, companyType, password, accountType } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        companyType,
        accountType, // "advertiser" or "personal"
        passwordHash: hashedPassword,
        role: companyType === "advertising" ? "advertiser" : "writer",
      },
    });

    // Create profile for publishing platform
    await prisma.publisherProfile.create({
      data: {
        userId: user.id,
        bio: name,
        settings: {
          emailNotifications: true,
          language: "en",
        },
      },
    });

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      message: "Account created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
