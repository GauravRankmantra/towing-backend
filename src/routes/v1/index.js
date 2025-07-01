const express = require('express')
const router = express.Router();
const zipRouter = require("./zipCodeRoutes.js");
const contactRouter = require("./contactRoutes.js")
const bulkRouter=require("./bulkUpload.js")

router.use("/zip", zipRouter);
router.use("/contact",contactRouter)
router.use("/bulk",bulkRouter)

module.exports = router;
