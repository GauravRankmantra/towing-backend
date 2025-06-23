const express = require('express')
const router = express.Router();
const zipRouter = require("./zipCodeRoutes.js");
const contactRouter = require("./contactRoutes.js")

router.use("/zip", zipRouter);
router.use("/contact",contactRouter)

module.exports = router;
