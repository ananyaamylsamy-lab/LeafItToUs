import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/database.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Create in CRUD: Add treatment method
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, instructions, type, problemsSolved, ingredients } = req.body;

    if (!name || !instructions || !type || !problemsSolved) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const treatments = getCollection("treatments");

    const treatment = {
      userId: req.session.userId,
      username: req.session.username,
      name,
      instructions,
      type,
      problemsSolved,
      ingredients: ingredients || [],
      successRate: 0,
      applications: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await treatments.insertOne(treatment);

    res.status(201).json({
      message: "Treatment created successfully",
      treatmentId: result.insertedId,
    });
  } catch (error) {
    console.error("Create treatment error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Read in CRUD: Get all treatments
router.get("/", async (req, res) => {
  try {
    const { type, problem, search } = req.query;
    const treatments = getCollection("treatments");

    let filter = {};
    if (type) {
      filter.type = type;
    }
    if (problem) {
      filter.problemsSolved = { $regex: problem, $options: "i" };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { problemsSolved: { $regex: search, $options: "i" } },
      ];
    }

    const results = await treatments
      .find(filter)
      .sort({ successRate: -1, createdAt: -1 })
      .toArray();

    res.json(results);
  } catch (error) {
    console.error("Get treatments error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single treatment
router.get("/:id", async (req, res) => {
  try {
    const treatments = getCollection("treatments");
    const treatment = await treatments.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!treatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    res.json(treatment);
  } catch (error) {
    console.error("Get treatment error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update in CRUD: Edit treatment
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { instructions, ingredients, type, problemsSolved } = req.body;
    const treatments = getCollection("treatments");

    const treatment = await treatments.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!treatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    if (treatment.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updates = {
      ...(instructions && { instructions }),
      ...(ingredients && { ingredients }),
      ...(type && { type }),
      ...(problemsSolved && { problemsSolved }),
      updatedAt: new Date(),
    };

    await treatments.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    res.json({ message: "Treatment updated successfully" });
  } catch (error) {
    console.error("Update treatment error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete in CRUD: Remove treatment
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const treatments = getCollection("treatments");

    const treatment = await treatments.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!treatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    if (treatment.userId !== req.session.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await treatments.deleteOne({ _id: new ObjectId(req.params.id) });

    res.json({ message: "Treatment deleted successfully" });
  } catch (error) {
    console.error("Delete treatment error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update treatment success rate
router.post("/:id/rate", requireAuth, async (req, res) => {
  try {
    const { success } = req.body;
    const treatments = getCollection("treatments");

    const treatment = await treatments.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!treatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    const newApplications = treatment.applications + 1;
    const currentSuccesses = Math.round(
      (treatment.successRate * treatment.applications) / 100
    );
    const newSuccesses = success ? currentSuccesses + 1 : currentSuccesses;
    const newSuccessRate = Math.round((newSuccesses / newApplications) * 100);

    await treatments.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          applications: newApplications,
          successRate: newSuccessRate,
          updatedAt: new Date(),
        },
      }
    );

    res.json({ message: "Treatment rated successfully" });
  } catch (error) {
    console.error("Rate treatment error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
