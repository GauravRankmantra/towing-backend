const express = require('express')
const router = express.Router();
const zipRouter = require("./zipCodeRoutes.js");

router.use("/zip", zipRouter);

module.exports = router;
