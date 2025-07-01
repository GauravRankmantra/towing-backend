const express = require("express");
const multer = require("multer");
const router = express.Router();
const { handleBulkUpload } = require("../../controllers/bulkUploadController.js");

const upload = multer({ dest: "uploads/" });

router.post("/upload-bulk", upload.single("file"), handleBulkUpload);

module.exports = router;
