const express = require('express')
const activityController = require('../controllers/activityController')
const achievementController = require('../controllers/achievementController')
const blogController = require('../controllers/blogController')
const committeeController = require('../controllers/committeeController')
const donationController = require('../controllers/donationController')
const galleryController = require('../controllers/galleryController')
const healthRoutes = require('./healthRoutes')
const meetingController = require('../controllers/meetingController')
const memberController = require('../controllers/memberController')
const noticeController = require('../controllers/noticeController')
const partnerController = require('../controllers/partnerController')
const registrationController = require('../controllers/registrationController')
const ruleController = require('../controllers/ruleController')
const settingsController = require('../controllers/settingsController')
const testimonialController = require('../controllers/testimonialController')
const tourController = require('../controllers/tourController')

const router = express.Router()

const publicAliases = [
  { method: 'get', path: '/achievements', handler: achievementController.getPublicItems },
  { method: 'get', path: '/activities', handler: activityController.getPublicItems },
  { method: 'get', path: '/blogs', handler: blogController.getPublicBlogs },
  { method: 'get', path: '/committee', handler: committeeController.getPublicItems },
  { method: 'get', path: '/donations', handler: donationController.getVerifiedDonations },
  { method: 'post', path: '/donations', handler: donationController.submitDonation },
  {
    method: 'get',
    path: '/donations/verified',
    handler: donationController.getVerifiedDonations,
  },
  { method: 'get', path: '/gallery', handler: galleryController.getPublicGalleryItems },
  { method: 'get', path: '/meetings', handler: meetingController.getPublicItems },
  { method: 'get', path: '/members/verify/:id', handler: memberController.verifyMemberPublic },
  { method: 'get', path: '/notices', handler: noticeController.getPublicItems },
  { method: 'get', path: '/partners', handler: partnerController.getPublicItems },
  { method: 'post', path: '/registrations', handler: registrationController.registerMember },
  { method: 'get', path: '/rules', handler: ruleController.getPublicItems },
  { method: 'get', path: '/settings', handler: settingsController.getPublicSettings },
  { method: 'get', path: '/testimonials', handler: testimonialController.getPublicItems },
  { method: 'get', path: '/tours', handler: tourController.getPublicItems },
]

publicAliases.forEach(({ method, path, handler }) => {
  router[method](path, handler)
})
router.use('/health', healthRoutes)

module.exports = router
module.exports.publicAliases = [
  ...publicAliases.map(({ method, path }) => ({ method, path })),
  { method: 'get', path: '/health' },
]
