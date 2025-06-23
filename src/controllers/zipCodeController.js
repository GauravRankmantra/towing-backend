// controllers/zipCodeController.js
const ZipCodeEntry = require("../models/ZipCodeEntry");
const Company = require("../models/Company");
const ErrorHandler = require("../utils/ErrorHandler");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const {
  uploadFile,
  destroyFile,
  getPublicIdFromCloudinaryUrl,
} = require("../services/cloudinary.js");
const fs = require("fs");
const util = require("util");

const unlinkFile = util.promisify(fs.unlink);
// CREATE ZipCode Entry
exports.createZipCodeEntry = asyncHandler(async (req, res, next) => {
  const { zipCode, cityName, mapLink } = req.body;

  if (!zipCode || !cityName) {
    return next(new ErrorHandler("Zip code and city name are required", 400));
  }

  const zipEntry = await ZipCodeEntry.create({ zipCode, cityName, mapLink });
  sendResponse(res, {
    statusCode: 201,
    message: "Zip code entry created successfully",
    data: zipEntry,
  });
});

// UPDATE ZipCode Entry
exports.updateZipCodeEntry = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { zipCode, cityName, mapLink } = req.body;

  const updated = await ZipCodeEntry.findByIdAndUpdate(
    id,
    { zipCode, cityName, mapLink },
    { new: true }
  );

  if (!updated) return next(new ErrorHandler("Zip code entry not found", 404));

  sendResponse(res, {
    message: "Zip code entry updated successfully",
    data: updated,
  });
});
exports.getZipCodeEntry = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const zip = await ZipCodeEntry.findById(id).populate("companies");
  if (!zip) {
    return next(new ErrorHandler("Zip Code entry not found", 404));
  }

  return sendResponse(res, {
    message: "Zip code entry retrieved successfully",
    data: zip,
  });
});

exports.deleteZipCodeEntry = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const zip = await ZipCodeEntry.findById(id);
  if (!zip) {
    return next(new ErrorHandler("Zip Code entry not found", 404));
  }

  // Delete all associated companies from DB
  await Promise.all(
    zip.companies.map(async (companyId) => {
      await Company.findByIdAndDelete(companyId);
    })
  );

  await zip.deleteOne();

  return sendResponse(res, {
    message: "Zip code entry and all linked companies deleted successfully",
  });
});

// GET All ZipCode Entries with populated companies
exports.getAllZipCodes = asyncHandler(async (req, res, next) => {
  const entries = await ZipCodeEntry.find().populate("companies");
  sendResponse(res, {
    data: entries,
  });
});

// 1. GET: Search by Zip Code (get all zip codes and their related companies)
exports.searchZipCode = asyncHandler(async (req, res, next) => {
  const { query } = req.query; // Expecting 'query' to be the zip code
  if (!query) return next(new ErrorHandler("Zip code query is required", 400));

  const results = await ZipCodeEntry.find({
    zipCode: { $regex: query, $options: "i" },
  }).populate("companies"); // Assuming 'companies' is the field in ZipCodeEntry that references Company documents

  sendResponse(res, {
    data: results,
  });
});

// 2. GET: Search by Company Name (get company name and its associated zip codes)
exports.searchCompanyByName = asyncHandler(async (req, res, next) => {
  const { query } = req.query; // Expecting 'query' to be the company name
  if (!query)
    return next(new ErrorHandler("Company name query is required", 400));

  // 1. Find companies matching the query from the Company model
  // We don't need to select fields here if we want to include everything later
  const matchedCompanies = await Company.find({
    name: { $regex: query, $options: "i" }, // Case-insensitive search
  });

  if (matchedCompanies.length === 0) {
    return sendResponse(res, {
      data: [],
      message: "No companies found with that name.",
    });
  }

  // Extract the IDs of the matched companies
  const matchedCompanyIds = matchedCompanies.map((company) => company._id);

  // 2. Find ZipCodeEntries that contain any of these matched company IDs
  // Crucially, populate the 'companies' field to get their full details
  const zipCodeEntries = await ZipCodeEntry.find({
    companies: { $in: matchedCompanyIds },
  })
    .populate({
      path: "companies", // The field in ZipCodeEntry that references Company
      // NO 'select' option here to include all fields from the Company model
    })
    .select("zipCode cityName mapLink companies"); // Select relevant fields from ZipCodeEntry

  // 3. Format the results to show company name and its associated zip code/city details
  const formattedResults = zipCodeEntries.map((zipEntry) => {
    // Filter the populated companies to only include those that were part of our initial search
    const relevantCompaniesInZipEntry = zipEntry.companies.filter((company) =>
      matchedCompanyIds.some((id) => id.equals(company._id))
    );

    return {
      zipCode: zipEntry.zipCode,
      cityName: zipEntry.cityName,
      mapLink: zipEntry.mapLink, // Include mapLink as per your model
      // List only the matched companies' full details for this zip code entry
      companies: relevantCompaniesInZipEntry.map((company) => ({
        // Spread the entire company object to include all its fields
        ...company.toObject(), // Use .toObject() for plain JS object if company is a Mongoose document
      })),
    };
  });

  sendResponse(res, {
    data: formattedResults,
    message: "Zip code and company details retrieved successfully.",
  });
});

// 3. GET: Search by City Name (get zip codes and companies in that city)
exports.searchByCityName = asyncHandler(async (req, res, next) => {
  const { query } = req.query; // Expecting 'query' to be the city name
  if (!query) return next(new ErrorHandler("City name query is required", 400));

  const results = await ZipCodeEntry.find({
    cityName: { $regex: query, $options: "i" },
  }).populate("companies"); // Populate related companies

  sendResponse(res, {
    data: results,
  });
});

// ADD company to existing zipCode entry
exports.addCompany = asyncHandler(async (req, res, next) => {
  const { zipCodeId } = req.body;

  const data = JSON.parse(req.body.companyDetails || "{}");

  if (!zipCodeId || !data.name || !data.phone) {
    const tempFilePaths = req.files ? req.files.map((file) => file.path) : [];
    // Clean up temporary files even if validation fails
    for (const filePath of tempFilePaths) {
      try {
        await unlinkFile(filePath);
        console.log(`Deleted temp file: ${filePath}`);
      } catch (unlinkError) {
        console.error(`Error deleting temp file ${filePath}:`, unlinkError);
      }
    }

    return next(new ErrorHandler("Missing required fields", 400));
  }

  const images = [];
  const tempFilePaths = [];

  if (req.files && req.files.length) {
    for (const file of req.files) {
      tempFilePaths.push(file.path);
      const result = await uploadFile(file.path);
      if (result?.secure_url) images.push(result.secure_url);
    }
  }

  const newCompany = await Company.create({ ...data, images });
  const zip = await ZipCodeEntry.findById(zipCodeId);
  if (!zip) return next(new ErrorHandler("ZipCode not found", 404));

  zip.companies.push(newCompany._id);
  await zip.save();
  for (const filePath of tempFilePaths) {
    try {
      await unlinkFile(filePath);
      console.log(`Deleted temp file: ${filePath}`);
    } catch (unlinkError) {
      // Log the error but don't prevent the response from being sent
      console.error(`Error deleting temp file ${filePath}:`, unlinkError);
    }
  }

  sendResponse(res, {
    statusCode: 201,
    message: "Company added successfully",
    data: newCompany,
  });
});

// UPDATE company
exports.updateCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const data = JSON.parse(req.body.companyDetails || "{}");

  const existing = await Company.findById(companyId);
  if (!existing) return next(new ErrorHandler("Company not found", 404));

  const newImages = [...existing.images];
  if (req.files && req.files.length) {
    for (const file of req.files) {
      const result = await uploadFile(file.path);
      if (result?.secure_url) newImages.push(result.secure_url);
    }
  }

  const updated = await Company.findByIdAndUpdate(
    companyId,
    { ...data, images: newImages },
    { new: true }
  );

  sendResponse(res, {
    message: "Company updated successfully",
    data: updated,
  });
});

// DELETE company
exports.deleteCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;


  const company = await Company.findById(companyId);
  if (!company) return next(new ErrorHandler("Company not found", 404));

  for (const img of company.images) {
    const publicId = getPublicIdFromCloudinaryUrl(img);
    if (publicId) await destroyFile(publicId);
  }

  await Company.findByIdAndDelete(companyId);
  await ZipCodeEntry.updateMany(
    { companies: companyId },
    { $pull: { companies: companyId } }
  );

  sendResponse(res, {
    message: "Company deleted successfully",
  });
});

exports.totalZipCodes = asyncHandler(async (req, res, next) => {
  const count = await ZipCodeEntry.countDocuments({});
  res.status(200).json({
    success: true,
    data: count,
    message: "Total number of zip code entries fetched successfully",
  });
});

exports.totalTowingCompanies = asyncHandler(async (req, res, next) => {
  const count = await Company.countDocuments({});
  res.status(200).json({
    success: true,
    data: count,
    message: "Total number of towing companies fetched successfully",
  });
});
