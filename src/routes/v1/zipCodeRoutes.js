const { upload } = require("../../middlewares/multer.middleware.js");
const express = require("express");
const router = express.Router();


const {
  createZipCodeEntry,
  getAllZipCodes,
  getZipCodeEntry,
  updateZipCodeEntry,
  deleteZipCodeEntry,
  addCompany,
  updateCompany,
  deleteCompany,
  searchZipCode,
  searchByCityName,
  searchCompanyByName
} = require("../../controllers/zipCodeController.js");



// Create a new Zip Code Entry
router.post("/addZipCode", createZipCodeEntry);

// Get all Zip Code Entries with populated company info
router.get("/", getAllZipCodes);

// Get a single Zip Code Entry by ID
router.get("/:id", getZipCodeEntry);

// Update Zip Code Entry by ID
router.put("/updateZip/:id", updateZipCodeEntry);

// Delete Zip Code Entry by ID
router.delete("/deleteZip/:id", deleteZipCodeEntry);


// router.get("/get/all-zipcodes", getAllZipCodes);



// Add a new Company to a specific Zip Code Entry
router.post("/addcompany", upload.array("images"), addCompany);

// Update a specific Company (within a zip code)
router.put("/updatecompany/:companyId", upload.array("images"), updateCompany);

// Delete a Company by ID
router.delete("/deletecompany/:companyId", deleteCompany);



// Search by zip code or city name
router.get("/search/zip", searchZipCode);
router.get("/search/city", searchByCityName);
router.get("/search/company", searchCompanyByName);

module.exports = router;
