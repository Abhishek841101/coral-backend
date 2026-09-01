import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const email = "admin@coral.com";
    const password = "Admin@(12)";

    const existingAdmin = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingAdmin) {
      existingAdmin.role = "admin";
      existingAdmin.isActive = true;
      existingAdmin.password = await bcrypt.hash(password, 12);

      await existingAdmin.save();

      console.log("Admin updated successfully");
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);

      await User.create({
        name: "Admin",
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });

      console.log("Admin created successfully");
    }

    console.log("Email:", email);
    console.log("Password:", password);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Admin creation failed:");
    console.error(error);
    process.exit(1);
  }
};

createAdmin();