const express = require("express");
const router = express.Router();
const { processCompany } = require("../controllers/aiController");

router.post("/process", processCompany);

module.exports = router;
