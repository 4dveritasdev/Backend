const express = require('express');
const router = express.Router();
const RewardController = require('../controllers/rewardController');

// Protect all routes after this middleware
// router.use(authController.protect);

router.get('/', RewardController.getAllRewards);
router.post('/filter', RewardController.getAllRewards);
router.get('/:id', RewardController.getReward);
router.post('/', RewardController.addReward);
router.put('/:id', RewardController.updateReward);
router.delete('/:id', RewardController.deleteReward);


module.exports = router;