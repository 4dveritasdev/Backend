const express = require('express');
const router = express.Router();
const airdropController = require('../controllers/airdropController');

// Protect all routes after this middleware
// router.use(authController.protect);

router.get('/', airdropController.getAllAirdrops);
router.get('/remainamount', airdropController.getRemainAmount);
router.get('/:id', airdropController.getAirdrop);
router.post('/', airdropController.addAirdrop);
router.put('/:id', airdropController.updateAirdrop);
router.delete('/:id', airdropController.deleteAirdrop);


module.exports = router;