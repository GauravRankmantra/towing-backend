const asyncHandler = require('../utils/asyncHandler'); 
const Contact = require('../models/Contact'); 
const ErrorHandler = require('../utils/ErrorHandler'); 


const sendResponse = (res, { statusCode, message, data = null }) => {
  res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  });
};

exports.createContactEntry = asyncHandler(async (req, res, next) => {
  const { name, email, phone, message, zip, address } = req.body;


  if (!name || !email || !message) {
    return next(new ErrorHandler('Name, email, and message are required fields.', 400));
  }


  const contactEntry = await Contact.create({
    name,
    email,
    phone,
    message,
    zip,
    address,
  });


  sendResponse(res, {
    statusCode: 201,
    message: 'Your message has been sent successfully!',
    data: contactEntry, // Optionally send back the created entry
  });
});


exports.getAllContactEntries = asyncHandler(async (req, res, next) => {
  
  const contactEntries = await Contact.find({});

 
  if (!contactEntries || contactEntries.length === 0) {
    return sendResponse(res, {
      statusCode: 200,
      message: 'No contact entries found.',
      data: [],
    });
  }


  sendResponse(res, {
    statusCode: 200,
    message: 'Contact entries fetched successfully.',
    data: contactEntries,
  });
});


exports.deleteContactEntry = asyncHandler(async (req, res, next) => {
  const { id } = req.params;


  const contactEntry = await Contact.findByIdAndDelete(id);

  if (!contactEntry) {
    return next(new ErrorHandler(`Contact entry with ID: ${id} not found.`, 404));
  }

 
  sendResponse(res, {
    statusCode: 200,
    message: 'Contact entry deleted successfully.',
    data: null, // No data to return after deletion
  });
});


exports.updateContactStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body; 

  if (!status || !['read', 'archived'].includes(status)) {
    return next(new ErrorHandler('Invalid status provided. Status must be "read" or "archived".', 400));
  }

  // Find the entry and update its status
  const contactEntry = await Contact.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true } // Return the updated document and run schema validators
  );

  if (!contactEntry) {
    return next(new ErrorHandler(`Contact entry with ID: ${id} not found.`, 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: `Contact entry status updated to ${status}.`,
    data: contactEntry,
  });
});
