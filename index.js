const express = require("express");
const app = express();
const port = 3000;
const imageRoutes = require("./routes/imageRoutes");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const imageKit = require("imagekit");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prismaClient = new PrismaClient();
require("dotenv").config();

app.use(express.json()); // Middleware for parsing application/json
app.use("/uploads", express.static("uploads"));

app.get("/", (_, res) => {
  res.send("Hello World!");
});

// router for images
app.use("/images", imageRoutes);

// Endpoint for upload image
app.post("/uploads/image", upload.single("image"), async (req, res) => {
  const { title, description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  try {
    // send file to ImageKit.io
    const imageKitClient = new imageKit({
      publicKey: process.env.IMAGEKIT_PUBLICKEY,
      privateKey: process.env.IMAGEKIT_PRIVATEKEY,
      urlEndpoint: process.env.IMAGEKIT_URLENDPOINT,
    });

    const uploadResponse = await imageKitClient.upload({
      file: fs.createReadStream(file.path), // send file stream
      fileName: file.originalname,
      folder: "/uploads",
      useUniqueFileName: false,
      tags: ["optimized"],
    });

    const { url } = uploadResponse;

    // save data image to database using Prisma
    const savedImage = await prismaClient.images.create({
      data: {
        title,
        description,
        url,
      },
    });

    res.status(201).json(savedImage);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}-${process.env.IMAGEKIT_URLENDPOINT}`);
});

module.exports = app;
