import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/database.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// (CRUD) CREATE - creating a new diagnosis
router.post("/", requireAuth, async (req, res) => {
  try {
    const { plantName, symptoms, photoUrl, description } = req.body;
    // Basic validation
    if (!plantName || !symptoms) {
      return res
        .status(400)
        .json({ error: "Plant name and symptoms are required" });
    }

    const diagnoses = getCollection("diagnoses");
    // Create diagnosis object
    const diagnosis = {
      userId: req.session.userId,
      username: req.session.username,
      plantName,
      symptoms,
      photoUrl: photoUrl || "",
      description: description || "",
      status: "ongoing",
      createdAt: new Date(),
      updatedAt: new Date(),
      treatments: [],
    };

    const result = await diagnoses.insertOne(diagnosis);

    res.status(201).json({
      message: "Diagnosis created successfully",
      diagnosisId: result.insertedId,
    });
  } catch (error) {
    console.error("Create diagnosis error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// (CRUD)READ - Get all diagnoses
router.get("/", async (req, res) => {
  try {
    const { search, status, plantSpecies } = req.query;
    const diagnoses = getCollection("diagnoses");

    let filter = {};
    if (search) {
      filter.$or = [
        { plantName: { $regex: search, $options: "i" } },
        { symptoms: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      filter.status = status;
    }
    if (plantSpecies) {
      filter.plantName = { $regex: plantSpecies, $options: "i" };
    }

    const results = await diagnoses
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(results);
  } catch (error) {
    console.error("Get diagnoses error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// READ - Get single diagnosis
router.get("/:id", async (req, res) => {
  try {
    const diagnoses = getCollection("diagnoses");
    const diagnosis = await diagnoses.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!diagnosis) {
      return res.status(404).json({ error: "Diagnosis not found" });
    }

    res.json(diagnosis);
  } catch (error) {
    console.error("Get diagnosis error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// (CRUD)UPDATE - Edit diagnosis
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { symptoms, status, description, photoUrl } = req.body;
    const diagnoses = getCollection("diagnoses");

    const diagnosis = await diagnoses.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!diagnosis) {
      return res.status(404).json({ error: "Diagnosis not found" });
    }

    if (diagnosis.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updates = {
      ...(symptoms && { symptoms }),
      ...(status && { status }),
      ...(description !== undefined && { description }),
      ...(photoUrl !== undefined && { photoUrl }),
      updatedAt: new Date(),
    };

    await diagnoses.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    res.json({ message: "Diagnosis updated successfully" });
  } catch (error) {
    console.error("Update diagnosis error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// (CRUD)DELETE - Remove diagnosis
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const diagnoses = getCollection("diagnoses");

    const diagnosis = await diagnoses.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!diagnosis) {
      return res.status(404).json({ error: "Diagnosis not found" });
    }

    if (diagnosis.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await diagnoses.deleteOne({ _id: new ObjectId(req.params.id) });

    res.json({ message: "Diagnosis deleted successfully" });
  } catch (error) {
    console.error("Delete diagnosis error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Apply treatment to diagnosis
router.post("/:id/treatments", requireAuth, async (req, res) => {
  try {
    const { treatmentId, result } = req.body;
    const diagnoses = getCollection("diagnoses");

    const application = {
      treatmentId,
      appliedBy: req.session.username,
      appliedAt: new Date(),
      result: result || "testing",
    };

    await diagnoses.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $push: { treatments: application },
        $set: { updatedAt: new Date() },
      }
    );

    res.json({ message: "Treatment applied successfully" });
  } catch (error) {
    console.error("Apply treatment error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
