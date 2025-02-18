// Import required modules
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Initialize Firebase
const serviceAccount = require("./firebase-key.json"); // Ensure this file exists
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json()); // ✅ Use express.json() instead of body-parser

// Test API Route
app.get("/", (req, res) => {
  res.send("Backend Server is Running!");
});

// ✅ Start the server
app.listen(5000, async () => {
  console.log("Server running on port 5000");

  /* ✅ Fetch all cases from Firestore on server startup for debugging
  try {
    const snapshot = await db.collection("cases").get();
    const cases = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log("Existing Cases in Firestore:", cases);
  } catch (error) {
    console.error("Error fetching cases on startup:", error);
  }*/
});

// ✅ API to log a new case
app.post("/cases", async (req, res) => {
  try {
    const newCase = {
      title: req.body.title,
      systemName: req.body.systemName,
      priority: req.body.priority || "Low",
      status: "Open",
      createdAt: admin.firestore.Timestamp.now() // ✅ Store Firestore Timestamp correctly
    };

    const caseRef = await db.collection("cases").add(newCase);
    res.status(201).send({ id: caseRef.id, ...newCase });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ✅ API to get all cases with formatted date
app.get("/cases", async (req, res) => {
  try {
    const snapshot = await db.collection("cases").get();
    const cases = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null // ✅ Correct Firestore Timestamp format
      };
    });
    res.status(200).send(cases);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ✅ API to update a case
app.put("/cases/:id", async (req, res) => {
  try {
    const caseId = req.params.id;
    const updateData = req.body;

    // Reference to case document in Firestore
    const caseRef = db.collection("cases").doc(caseId);

    // Check if the case exists before updating
    const caseDoc = await caseRef.get();
    if (!caseDoc.exists) {
      return res.status(404).send({ error: "Case not found" });
    }

    // Update the case with new data
    await caseRef.update(updateData);
    res.status(200).send({ message: "Case updated successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});