
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "Coral Admin";

    if (!email || !password) {
      console.error(
        "ADMIN_EMAIL and ADMIN_PASSWORD are required in .env"
      );

      process.exit(1);
    }

    if (password.length < 8) {
      console.error(
        "Admin password must be at least 8 characters."
      );

      process.exit(1);
    }

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    const existingAdmin = await User.findOne({
      email: normalizedEmail,
    });

    if (existingAdmin) {
      if (existingAdmin.role === "admin") {
        console.log(
          "Admin account already exists."
        );
      } else {
        existingAdmin.role = "admin";
        existingAdmin.isActive = true;

        await existingAdmin.save();

        console.log(
          "Existing user promoted to admin."
        );
      }

      await mongoose.connection.close();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("=================================");
    console.log("Admin created successfully");
    console.log("=================================");
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log("Password: [hidden]");
    console.log("=================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(
      "Admin creation failed:",
      error.message
    );

    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();