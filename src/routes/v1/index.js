const express = require('express')
const router = express.Router();
const zipRouter = require("./zipCodeRoutes.js");
const contactRouter = require("./contactRoutes.js")
const bulkRouter=require("./bulkUpload.js")
const healthRouter=require("./healthCheck.js")

router.use("/zip", zipRouter);
router.use("/contact",contactRouter)
router.use("/bulk",bulkRouter)
router.use("/health",healthRouter)

module.exports = router;
