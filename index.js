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
    // Initialize ImageKit client
    const imageKitClient = new imageKit({
      publicKey: process.env.IMAGEKIT_PUBLICKEY,
      privateKey: process.env.IMAGEKIT_PRIVATEKEY,
      urlEndpoint: process.env.IMAGEKIT_URLENDPOINT,
    });

    // Upload image to ImageKit.io and apply transformations
    const uploadResponse = await imageKitClient.upload({
      file: fs.createReadStream(file.path), // Send file stream
      fileName: file.originalname,
      folder: "/uploads",
      useUniqueFileName: true, // Use unique filename
      responseFields: ["url", "thumbnailUrl"], // Get URL and thumbnail URL
      transformation: [
        {
          width: 800, // Resize image width to 800px
          height: 600, // Resize image height to 600px
          quality: 80, // Set image quality to 80%
          cropMode: "limit", // Limit image cropping
        },
        {
          overlayOpacity: 50, // Set watermark opacity to 50%
        },
      ],
    });

    const { url, thumbnailUrl } = uploadResponse;

    // Save image data to database using Prisma
    const savedImage = await prismaClient.images.create({
      data: {
        title,
        description,
        url,
        thumbnailUrl,
      },
    });

    res.status(201).json(savedImage);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    // Delete temporary uploaded file
    fs.unlinkSync(file.path);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
