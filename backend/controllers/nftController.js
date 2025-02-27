const NFT = require('../models/NFT');
const User = require('../models/User');
const ipfsService = require('../services/ipfsService');
const contractInteraction = require('../utils/contractInteraction');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new NFT
 * @route   POST /api/nft
 * @access  Private
 */
exports.createNFT = async (req, res, next) => {
  try {
    // Validate request inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, price, royaltyPercentage } = req.body;
    const creator = req.user.id;

    // Check if file is uploaded
    if (!req.files || !req.files.image) {
      return res.status(400).json({ success: false, error: 'Please upload an image file' });
    }

    const imageFile = req.files.image;

    // Upload image to IPFS
    const imageHash = await ipfsService.uploadFile(imageFile);
    
    // Create metadata for the NFT
    const metadata = {
      name,
      description,
      image: `ipfs://${imageHash}`,
      creator: req.user.address,
      createdAt: new Date().toISOString(),
      attributes: req.body.attributes || []
    };
    
    // Upload metadata to IPFS
    const metadataHash = await ipfsService.uploadJSON(metadata);
    
    // Mint NFT on blockchain
    const tokenId = await contractInteraction.mintNFT(
      req.user.address,
      `ipfs://${metadataHash}`
    );
    
    // Create NFT record in database
    const nft = new NFT({
      tokenId,
      name,
      description,
      imageHash,
      metadataHash,
      price,
      royaltyPercentage: royaltyPercentage || 10, // Default 10%
      creator,
      owner: creator,
      contractAddress: process.env.NFT_CONTRACT_ADDRESS
    });
    
    await nft.save();
    
    // Update user's created NFTs
    await User.findByIdAndUpdate(creator, {
      $push: { createdNFTs: nft._id }
    });
    
    res.status(201).json({
      success: true,
      data: nft
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all NFTs
 * @route   GET /api/nft
 * @access  Public
 */
exports.getAllNFTs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    
    // Build query based on filters
    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }
    
    // Filter by creator
    if (req.query.creator) {
      query.creator = req.query.creator;
    }
    
    // Search by name or description
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Count total documents for pagination
    const total = await NFT.countDocuments(query);
    
    // Sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price-asc':
          sortOptions = { price: 1 };
          break;
        case 'price-desc':
          sortOptions = { price: -1 };
          break;
        case 'oldest':
          sortOptions = { createdAt: 1 };
          break;
        case 'newest':
          sortOptions = { createdAt: -1 };
          break;
      }
    }
    
    // Fetch NFTs with pagination and populate creator info
    const nfts = await NFT.find(query)
      .sort(sortOptions)
      .skip(startIndex)
      .limit(limit)
      .populate('creator', 'username address profileImage')
      .populate('owner', 'username address profileImage');
    
    // Pagination result
    const pagination = {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit
    };
    
    res.status(200).json({
      success: true,
      count: nfts.length,
      pagination,
      data: nfts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single NFT by ID
 * @route   GET /api/nft/:id
 * @access  Public
 */
exports.getNFTById = async (req, res, next) => {
  try {
    const nft = await NFT.findById(req.params.id)
      .populate('creator', 'username address profileImage bio')
      .populate('owner', 'username address profileImage')
      .populate({
        path: 'history',
        populate: {
          path: 'from to',
          select: 'username address profileImage'
        }
      });
    
    if (!nft) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found'
      });
    }
    
    // Get blockchain data to ensure it's up to date
    const onchainData = await contractInteraction.getNFTData(nft.tokenId);
    
    // Update database record if ownership has changed
    if (onchainData.owner !== nft.owner.address) {
      const newOwner = await User.findOne({ address: onchainData.owner });
      
      if (newOwner) {
        nft.owner = newOwner._id;
        nft.status = 'owned';
        await nft.save();
      }
    }
    
    res.status(200).json({
      success: true,
      data: nft
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update NFT details
 * @route   PUT /api/nft/:id
 * @access  Private
 */
exports.updateNFT = async (req, res, next) => {
  try {
    let nft = await NFT.findById(req.params.id);
    
    if (!nft) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found'
      });
    }
    
    // Check ownership
    if (nft.creator.toString() !== req.user.id && nft.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this NFT'
      });
    }
    
    // Only allow updating certain fields
    const { name, description, price, status } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = price;
    if (status) updateData.status = status;
    
    // Update NFT
    nft = await NFT.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: nft
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List NFT for sale
 * @route   POST /api/nft/:id/list
 * @access  Private
 */
exports.listNFTForSale = async (req, res, next) => {
  try {
    const { price } = req.body;
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid price'
      });
    }
    
    const nft = await NFT.findById(req.params.id);
    
    if (!nft) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found'
      });
    }
    
    // Verify ownership
    if (nft.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You are not the owner of this NFT'
      });
    }
    
    // Create listing on blockchain
    const listingId = await contractInteraction.createListing(
      req.user.address,
      process.env.NFT_CONTRACT_ADDRESS,
      nft.tokenId,
      price
    );
    
    // Update NFT in database
    nft.status = 'listed';
    nft.price = price;
    nft.listingId = listingId;
    
    await nft