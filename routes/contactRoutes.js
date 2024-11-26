const express = require('express');
const submitContactForm = require('../controllers/contactController');
const router = express.Router();

// POST route for submitting the contact form

router.post('/contact', submitContactForm.submitContactForm);

module.exports = router;
