const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Chat = require('../models/Chat');
const ShopperAd = require('../models/ShopperAd');
const emailService = require('../services/emailService');

// Get chat room by ad ID
router.get('/ad/:adId', auth, function(req, res) {
  Chat.findOne({
    shopperAd: req.params.adId,
    $or: [{ shopper: req.user.id }, { traveler: req.user.id }]
  })
    .populate('shopper', 'username')
    .populate('traveler', 'username')
    .populate('shopperAd')
    .then(chat => {
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      res.json(chat);
    })
    .catch(error => {
      console.error('Error fetching chat:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Send message to ad
router.post('/ad/:adId/messages', auth, async function(req, res) {
  try {
    const { content } = req.body;
    
    // Find or create chat room
    let chat = await Chat.findOne({
      shopperAd: req.params.adId,
      $or: [{ shopper: req.user.id }, { traveler: req.user.id }]
    });

    if (!chat) {
      // Find the ad to get shopper and traveler
      const ad = await ShopperAd.findById(req.params.adId);
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }

      // Create new chat room
      chat = new Chat({
        shopperAd: ad._id,
        shopper: ad.user,
        traveler: req.user.id,
        messages: []
      });
    }

    // Add message
    chat.messages.push({
      sender: req.user.id,
      content,
      timestamp: new Date()
    });

    await chat.save();

    // Populate and return the latest message
    await chat.populate('messages.sender', 'username');
    const latestMessage = chat.messages[chat.messages.length - 1];

    res.json(latestMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/:chatId/messages', auth, function(req, res) {
  const { content } = req.body;
  Chat.findOne({
    _id: req.params.chatId,
    $or: [{ shopper: req.user.id }, { traveler: req.user.id }]
  })
    .populate('shopper', 'username email')
    .populate('traveler', 'username email')
    .populate('shopperAd')
    .then(chat => {
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Validate message content
      if (!chat.validateMessage(content)) {
        return res.status(400).json({
          message: 'Message contains contact information which is not allowed'
        });
      }

      // Add message
      chat.messages.push({
        sender: req.user.id,
        content,
        timestamp: new Date(),
        read: false
      });

      return chat.save().then(() => {
        // Get recipient
        const recipient = chat.shopper._id.toString() === req.user.id
          ? chat.traveler
          : chat.shopper;

        // Send email notification for new message
        emailService.sendNewMessageEmail(recipient, req.user, chat.shopperAd.productUrl)
          .catch(emailError => {
            console.error('Error sending email notification:', emailError);
            // Continue even if email fails
          });

        res.json(chat.messages[chat.messages.length - 1]);
      });
    })
    .catch(error => {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Mark messages as read
router.patch('/:chatId/read', auth, function(req, res) {
  Chat.findOne({
    _id: req.params.chatId,
    $or: [{ shopper: req.user.id }, { traveler: req.user.id }]
  })
    .then(chat => {
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Mark all messages from the other user as read
      chat.messages.forEach(message => {
        if (message.sender.toString() !== req.user.id) {
          message.read = true;
        }
      });

      return chat.save().then(() => {
        res.json({ message: 'Messages marked as read' });
      });
    })
    .catch(error => {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Get user's active chats
router.get('/active', auth, function(req, res) {
  Chat.find({
    status: 'active',
    $or: [{ shopper: req.user.id }, { traveler: req.user.id }]
  })
    .populate('shopper', 'username')
    .populate('traveler', 'username')
    .populate('shopperAd')
    .sort('-lastMessage')
    .then(chats => {
      res.json(chats);
    })
    .catch(error => {
      console.error('Error fetching active chats:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

module.exports = router;
