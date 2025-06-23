const express = require('express');
const {
  createContactEntry,
  getAllContactEntries,
  deleteContactEntry,
  updateContactStatus 
} = require('../../controllers/contactController'); 

const router = express.Router();


router.post('/', createContactEntry);


router.get('/', getAllContactEntries);


router.delete('/:id', deleteContactEntry);


router.put('/:id/status', updateContactStatus);

module.exports = router;
