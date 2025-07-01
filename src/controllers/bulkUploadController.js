const AdmZip = require("adm-zip");
const path = require("path");
const fs = require("fs/promises");
const xlsx = require("xlsx");
const { uploadFile, unlinkFile } = require("../utils/file");
const ZipCodeEntry = require("../models/ZipCodeEntry");
const Company = require("../models/Company");
const asyncHandler = require("../utils/asyncHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const sendResponse = require("../utils/sendResponse");

exports.handleBulkUpload = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ErrorHandler("No file uploaded", 400));

  const tempExtractPath = path.join(__dirname, "../temp/bulk_upload");
  const imagesFolderName = "images";
  const excelFileName = "bulk_data.xlsx";

  // Unzip uploaded file
  const zip = new AdmZip(req.file.path);
  zip.extractAllTo(tempExtractPath, true);

  const excelPath = path.join(tempExtractPath, excelFileName);
  const imagesPath = path.join(tempExtractPath, imagesFolderName);

  let workbook;
  try {
    workbook = xlsx.readFile(excelPath);
  } catch (err) {
    return next(new ErrorHandler("Invalid or missing Excel file", 400));
  }

  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const zipMap = new Map(); // to avoid duplicate zip creation

  const createdCompanies = [];

  for (const row of rows) {
    const {
      ZipCode,
      CityName,
      MapLink,
      CompanyName,
      Phone,
      Email,
      Website,
      Location,
      ExactAddress,
      Distance,
      OperatingHours,
      Services,
      MapLinkCompany,
      ImageFilenames,
    } = row;

    if (!ZipCode || !CityName || !CompanyName || !Phone) continue;

    let zipEntry;
    if (zipMap.has(ZipCode)) {
      zipEntry = zipMap.get(ZipCode);
    } else {
      zipEntry = await ZipCodeEntry.findOne({ zipCode: ZipCode });
      if (!zipEntry) {
        zipEntry = await ZipCodeEntry.create({
          zipCode: ZipCode,
          cityName: CityName,
          mapLink: MapLink || "",
        });
      }
      zipMap.set(ZipCode, zipEntry);
    }

    const images = [];
    const filenames = (ImageFilenames || "").split(",").map(f => f.trim()).filter(Boolean);

    for (const filename of filenames) {
      const localImagePath = path.join(imagesPath, filename);
      try {
        const result = await uploadFile(localImagePath);
        if (result?.secure_url) images.push(result.secure_url);
      } catch (error) {
        console.error(`Image upload failed for ${filename}:`, error);
      }
    }

    const company = await Company.create({
      name: CompanyName,
      phone: Phone,
      email: Email || "",
      website: Website || "",
      location: Location || "",
      exactAddress: ExactAddress || "",
      distance: Distance || "",
      operatingHours: OperatingHours || "",
      services: (Services || "").split(",").map(s => s.trim()),
      images,
      mapLink: MapLinkCompany || "",
    });

    zipEntry.companies.push(company._id);
    await zipEntry.save();

    createdCompanies.push(company);
  }

  // Clean up
  await fs.rm(tempExtractPath, { recursive: true, force: true });
  await fs.unlink(req.file.path);

  sendResponse(res, {
    statusCode: 201,
    message: `Bulk upload successful (${createdCompanies.length} companies added)`,
    data: createdCompanies,
  });
});
