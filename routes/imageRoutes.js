const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prismaClient = new PrismaClient();

// show all images
router.get("/", async (_, res) => {
  const images = await prismaClient.images.findMany();
  res.json(images);
});

// show image by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const image = await prismaClient.images.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  res.json(image);
});

// delete image by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prismaClient.images.delete({
    where: {
      id: parseInt(id),
    },
  });
  res.json({ message: "Image deleted successfully" });
});

// update title and description image
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const updatedImage = await prismaClient.images.update({
    where: {
      id: parseInt(id),
    },
    data: {
      title,
      description,
    },
  });

  res.json(updatedImage);
});

module.exports = router;
