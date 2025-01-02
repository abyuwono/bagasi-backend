const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const emailService = require('../services/emailService');

// Get chat room by ad ID
router.get('/ad/:adId', [auth], async (req, res) => {
  try {
    const chat = await Chat.findOne({
      shopperAd: req.params.adId,
      $or: [{ shopper: req.user.id }, { traveler: req.user.id }]
    })
      .populate('shopper', 'username')
      .populate('traveler', 'username')
      .populate('shopperAd');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/:chatId/messages', [auth], async (req, res) => {
  try {
    const { content } = req.body;
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      $or: [{ shopper: req.user.id }, { traveler: req.user.id }]
    })
      .populate('shopper', 'username email')
      .populate('traveler', 'username email')
      .populate('shopperAd');

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

    await chat.save();

    // Get recipient
    const recipient = chat.shopper._id.toString() === req.user.id
      ? chat.traveler
      : chat.shopper;

    // Send email notification for new message
    try {
      await emailService.sendNewMessageEmail(recipient, req.user, chat.shopperAd.productUrl);
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Continue even if email fails
    }

    res.json(chat.messages[chat.messages.length - 1]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.patch('/:chatId/read', [auth], async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      $or: [{ shopper: req.user.id }, { traveler: req.user.id }]
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Mark all messages from the other user as read
    chat.messages.forEach(message => {
      if (message.sender.toString() !== req.user.id) {
        message.read = true;
      }
    });

    await chat.save();
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's active chats
router.get('/active', [auth], async (req, res) => {
  try {
    const chats = await Chat.find({
      status: 'active',
      $or: [{ shopper: req.user.id }, { traveler: req.user.id }]
    })
      .populate('shopper', 'username')
      .populate('traveler', 'username')
      .populate('shopperAd')
      .sort('-lastMessage');

    res.json(chats);
  } catch (error) {
    console.error('Error fetching active chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
