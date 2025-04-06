const Webinar = require('../models/Webinar');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const zoomService = require('../services/zoomService');
const notificationService = require('../services/notificationService');

// @desc    Get all webinars
// @route   GET /api/webinars
// @access  Public
const getWebinars = asyncHandler(async (req, res) => {
  const { status, category, type, search, upcoming, past, limit, department, role } = req.query;
  
  // Build query object
  const queryObj = {};
  
  // Only show published webinars for non-admin users
  if (!req.user || req.user.role !== 'admin') {
    queryObj.isPublished = true;
  }
  
  // Filter by status
  if (status && ['Scheduled', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
    queryObj.status = status;
  }
  
  // Filter by category
  if (category) {
    queryObj.category = category;
  }
  
  // Filter by type
  if (type && ['Live', 'Recorded', 'Hybrid'].includes(type)) {
    queryObj.type = type;
  }
  
  // Filter by department target
  if (department) {
    queryObj.targetDepartments = { $in: [department] };
  }
  
  // Filter by role target
  if (role) {
    queryObj.targetRoles = { $in: [role] };
  }
  
  // Filter upcoming webinars
  if (upcoming === 'true') {
    const now = new Date();
    queryObj.startDate = { $gt: now };
    queryObj.status = { $ne: 'Cancelled' };
  }
  
  // Filter past webinars
  if (past === 'true') {
    const now = new Date();
    queryObj.endDate = { $lt: now };
  }
  
  // Search by title or description
  if (search) {
    queryObj.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limitVal = parseInt(limit, 10) || 10;
  const startIndex = (page - 1) * limitVal;
  
  // Sort by start date (upcoming first, then past)
  const sort = { startDate: 1 }; // Default sort for upcoming
  
  if (past === 'true') {
    sort.startDate = -1; // Sort by most recent first for past webinars
  }
  
  // Execute query with populated data
  const webinars = await Webinar.find(queryObj)
    .populate('skillsRelated', 'name category')
    .populate('relatedCourses', 'title category')
    .populate('createdBy', 'name')
    .sort(sort)
    .skip(startIndex)
    .limit(limitVal);
  
  // Get total count for pagination
  const total = await Webinar.countDocuments(queryObj);
  
  // Add registration status for authenticated users
  if (req.user) {
    const webinarsWithStatus = webinars.map(webinar => {
      const webinarObj = webinar.toObject();
      
      // Check if user is registered
      const userRegistration = webinar.registrations.find(
        reg => reg.user && reg.user.toString() === req.user.id
      );
      
      if (userRegistration) {
        webinarObj.isRegistered = true;
        webinarObj.registeredOn = userRegistration.registeredOn;
        webinarObj.registrantJoinUrl = userRegistration.registrantJoinUrl;
        webinarObj.attended = userRegistration.attended;
      } else {
        webinarObj.isRegistered = false;
      }
      
      // Remove registration details for privacy
      delete webinarObj.registrations;
      
      return webinarObj;
    });
    
    return res.status(200).json({
      success: true,
      count: webinars.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limitVal)
      },
      data: webinarsWithStatus
    });
  }
  
  // For non-authenticated users, remove registration details
  const webinarsWithoutRegistrations = webinars.map(webinar => {
    const webinarObj = webinar.toObject();
    
    // Just keep the count
    webinarObj.registrationCount = webinar.registrationCount;
    delete webinarObj.registrations;
    
    return webinarObj;
  });
  
  res.status(200).json({
    success: true,
    count: webinars.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limitVal)
    },
    data: webinarsWithoutRegistrations
  });
});

// @desc    Get single webinar
// @route   GET /api/webinars/:id
// @access  Public
const getWebinar = asyncHandler(async (req, res) => {
  const webinar = await Webinar.findById(req.params.id)
    .populate('skillsRelated', 'name category')
    .populate('relatedCourses', 'title description category thumbnail')
    .populate('createdBy', 'name');
  
  if (!webinar) {
    return res.status(404).json({
      success: false,
      error: 'Webinar not found'
    });
  }
  
  // Check if webinar is published or user is admin
  if (!webinar.isPublished && (!req.user || req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      error: 'Access to unpublished webinar denied'
    });
  }
  
  // Format webinar data based on authentication
  const webinarObj = webinar.toObject();
  
  // Add registration status for authenticated users
  if (req.user) {
    // Check if user is registered
    const userRegistration = webinar.registrations.find(
      reg => reg.user && reg.user.toString() === req.user.id
    );
    
    if (userRegistration) {
      webinarObj.isRegistered = true;
      webinarObj.registeredOn = userRegistration.registeredOn;
      webinarObj.registrantJoinUrl = userRegistration.registrantJoinUrl;
      webinarObj.attended = userRegistration.attended;
      webinarObj.feedbackSubmitted = userRegistration.feedbackSubmitted;
    } else {
      webinarObj.isRegistered = false;
    }
    
    // Remove other users' registration details for privacy
    if (req.user.role !== 'admin') {
      delete webinarObj.registrations;
    } else {
      // For admin, populate user details in registrations
      const populatedRegistrations = await Promise.all(
        webinar.registrations.map(async (reg) => {
          if (reg.user) {
            const user = await User.findById(reg.user).select('name email department role');
            return {
              ...reg.toObject(),
              user
            };
          }
          return reg.toObject();
        })
      );
      
      webinarObj.registrations = populatedRegistrations;
    }
  } else {
    // For non-authenticated users, remove registration details
    webinarObj.registrationCount = webinar.registrationCount;
    delete webinarObj.registrations;
  }
  
  res.status(200).json({
    success: true,
    data: webinarObj
  });
});

// @desc    Create new webinar
// @route   POST /api/webinars
// @access  Private/Admin
const createWebinar = asyncHandler(async (req, res) => {
  // Set creator
  req.body.createdBy = req.user.id;
  
  // Create webinar in database
  const webinar = await Webinar.create(req.body);
  
  // If integration with Zoom is enabled and webinar is live
  if (req.body.type === 'Live' && process.env.ZOOM_INTEGRATION_ENABLED === 'true') {
    try {
      // Create Zoom webinar
      const zoomWebinar = await zoomService.createWebinar({
        title: webinar.title,
        description: webinar.description,
        startDate: webinar.startDate,
        duration: webinar.duration,
        timezone: webinar.timezone,
        alternativeHosts: req.body.alternativeHosts,
        contactName: webinar.presenter.name,
        contactEmail: webinar.presenter.email || req.user.email
      });
      
      // Update webinar with Zoom details
      webinar.zoomMeetingId = zoomWebinar.webinarId;
      webinar.zoomPassword = zoomWebinar.password;
      webinar.joinUrl = zoomWebinar.joinUrl;
      webinar.hostUrl = zoomWebinar.startUrl;
      
      await webinar.save();
    } catch (error) {
      console.error('Error creating Zoom webinar:', error);
      // Don't fail the request, just log the error
    }
  }
  
  res.status(201).json({
    success: true,
    data: webinar
  });
});

// @desc    Update webinar
// @route   PUT /api/webinars/:id
// @access  Private/Admin
const updateWebinar = asyncHandler(async (req, res) => {
  let webinar = await Webinar.findById(req.params.id);
  
  if (!webinar) {
    return res.status(404).json({
      success: false,
      error: 'Webinar not found'
    });
  }
  
  // Update webinar in database
  webinar = await Webinar.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  // If Zoom integration is enabled and webinar details changed
  if (
    process.env.ZOOM_INTEGRATION_ENABLED === 'true' &&
    webinar.zoomMeetingId &&
    (
      req.body.title ||
      req.body.description ||
      req.body.startDate ||
      req.body.duration ||
      req.body.timezone
    )
  ) {
    try {
      // Update Zoom webinar
      await zoomService.updateWebinar(webinar.zoomMeetingId, {
        title: webinar.title,
        description: webinar.description,
        startDate: webinar.startDate,
        duration: webinar.duration,
        timezone: webinar.timezone
      });
    } catch (error) {
      console.error('Error updating Zoom webinar:', error);
      // Don't fail the request, just log the error
    }
  }
  
  res.status(200).json({
    success: true,
    data: webinar
  });
});

// @desc    Delete webinar
// @route   DELETE /api/webinars/:id
// @access  Private/Admin
const deleteWebinar = asyncHandler(async (req, res) => {
  const webinar = await Webinar.findById(req.params.id);
  
  if (!webinar) {
    return res.status(404).json({
      success: false,
      error: 'Webinar not found'
    });
  }
  
  // If Zoom integration is enabled and webinar has Zoom ID
  if (process.env.ZOOM_INTEGRATION_ENABLED === 'true' && webinar.zoomMeetingId) {
    try {
      // Delete Zoom webinar
      await zoomService.deleteWebinar(webinar.zoomMeetingId);
    } catch (error) {
      console.error('Error deleting Zoom webinar:', error);
      // Don't fail the request, just log the error
    }
  }
  
  await webinar.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Register for webinar
// @route   POST /api/webinars/:id/register
// @access  Private
const registerForWebinar = asyncHandler(async (req, res) => {
  const webinar = await Webinar.findById(req.params.id);
  
  if (!webinar) {
    return res.status(404).json({
      success: false,
      error: 'Webinar not found'
    });
  }
  
  // Check if webinar is published
  if (!webinar.isPublished) {
    return res.status(400).json({
      success: false,
      error: 'Cannot register for unpublished webinar'
    });
  }
  
  // Check if webinar is not cancelled
  if (webinar.status === 'Cancelled') {
    return res.status(400).json({
      success: false,
      error: 'Cannot register for cancelled webinar'
    });
  }
  
  // Check if webinar is in the future
  const now = new Date();
  if (new Date(webinar.startDate) < now) {
    return res.status(400).json({
      success: false,
      error: 'Cannot register for past webinar'
    });
  }
  
  // Check if capacity is reached
  if (webinar.registrations.length >= webinar.capacity) {
    return res.status(400).json({
      success: false,
      error: 'Webinar has reached maximum capacity'
    });
  }
  
  // Check if user is already registered
  const existingRegistration = webinar.registrations.find(
    reg => reg.user && reg.user.toString() === req.user.id
  );
  
  if (existingRegistration) {
    return res.status(400).json({
      success: false,
      error: 'Already registered for this webinar'
    });
  }
  
  // Create registration object
  const registration = {
    user: req.user.id,
    registeredOn: Date.now(),
    attended: false,
    feedbackSubmitted: false
  };
  
  // If Zoom integration is enabled
  if (process.env.ZOOM_INTEGRATION_ENABLED === 'true' && webinar.zoomMeetingId) {
    try {
      // Get user details
      const user = await User.findById(req.user.id);
      
      // Register participant in Zoom
      const registrantInfo = await zoomService.registerParticipant(
        webinar.zoomMeetingId,
        {
          email: user.email,
          firstName: user.name.split(' ')[0],
          lastName: user.name.split(' ').slice(1).join(' ') || '',
          jobTitle: user.role,
          organization: user.department,
          employeeId: user.employeeId
        }
      );
      
      // Add Zoom registration details
      registration.registrantId = registrantInfo.registrantId;
      registration.registrantJoinUrl = registrantInfo.joinUrl;
    } catch (error) {
      console.error('Error registering with Zoom:', error);
      // Continue with local registration even if Zoom fails
    }
  }
  
  // Add registration to webinar
  webinar.registrations.push(registration);
  await webinar.save();
  
  // Send notification
  await notificationService.sendNotification(
    req.user.id,
    'Webinar Registration',
    `You have successfully registered for "${webinar.title}" on ${new Date(webinar.startDate).toLocaleString()}`,
    {
      type: 'webinar_registration',
      metadata: {
        webinarId: webinar._id,
        webinarTitle: webinar.title,
        webinarDate: webinar.startDate,
        webinarJoinUrl: registration.registrantJoinUrl || webinar.joinUrl
      }
    }
  );
  
  res.status(200).json({
    success: true,
    data: {
      webinarId: webinar._id,
      registeredOn: registration.registeredOn,
      joinUrl: registration.registrantJoinUrl || webinar.joinUrl
    }
  });
});

// @desc    Cancel webinar registration
// @route   DELETE /api/webinars/:id/register
// @access  Private
const cancelRegistration = asyncHandler(async (req, res) => {
  const webinar = await Webinar.findById(req.params.id);
  
  if (!webinar) {
    return res.status(404).json({
      success: false,
      error: 'Webinar not found'
    });
  }
  
  // Find user's registration
  const registrationIndex = webinar.registrations.findIndex(
    reg => reg.user && reg.user.toString() === req.user.id
  );
  
  if (registrationIndex === -1) {
    return res.status(400).json({
      success: false,
      error: 'Not registered for this webinar'
    });
  }
  
  const registration = webinar.registrations[registrationIndex];
  
  // If Zoom integration is enabled and there's a registrant ID
  if (
    process.env.ZOOM_INTEGRATION_ENABLED === 'true' &&
    webinar.zoomMeetingId &&
    registration.registrantId
  ) {
    try {
      // Cancel registration in Zoom
      await zoomService.cancelRegistration(
        webinar.zoomMeetingId,
        registration.registrantId
      );
    } catch (error) {
      console.error('Error cancelling Zoom registration:', error);
      // Continue with local cancellation even if Zoom fails
    }
  }
  
  // Remove registration
  webinar.registrations.splice(registrationIndex, 1);
  await webinar.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Mark attendance for webinar
// @route   PUT /api/webinars/:id/attendance
// @access  Private/Admin
const markAttendance = asyncHandler(async (req, res) => {
  const { attendees } = req.body;
  
  if (!attendees || !Array.isArray(attendees)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide an array of attendee user IDs'
    });
  }
  
  const webinar = await Webinar.findById(req.params.id);
  
  if (!webinar) {
    return res.status(404).json({
      success: false,
      error: 'Webinar not found'
    });
  }
  
  // Mark attendance for each attendee
  let attendanceCount = 0;
  
  for (const userId of attendees) {
    const registrationIndex = webinar.registrations.findIndex(
      reg => reg.user && reg.user.toString() === userId
    );
    
    if (registrationIndex !== -1) {
      webinar.registrations[registrationIndex].attended = true;
      attendanceCount++;
    }
  }
  
  await webinar.save();
  
  res.status(200).json({
    success: true,
    data: {
      markedAttendees: attendanceCount,
      totalRegistrations: webinar.registrations.length
    }
  });
});

// @desc    Submit webinar feedback
// @route   POST /api/webinars/:id/feedback
// @access  Private
const submitFeedback = asyncHandler(async (req, res) => {
  const { rating, feedback } = req.body;
  
  if (!rating) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a rating'
    });
  }
  
  const webinar = await Webinar.findById(req.params.id);
  
  if (!webinar) {
    return res.status(404).json({
      success: false,
      error: 'Webinar not found'
    });
  }
  
  // Find user's registration
  const registrationIndex = webinar.registrations.findIndex(
    reg => reg.user && reg.user.toString() === req.user.id
  );
  
  if (registrationIndex === -1) {
    return res.status(400).json({
      success: false,
      error: 'Not registered for this webinar'
    });
  }
  
  // Update registration with feedback info
  webinar.registrations[registrationIndex].feedbackSubmitted = true;
  
  // Store feedback in a new array if it doesn't exist
  if (!webinar.feedback) {
    webinar.feedback = [];
  }
  
  // Add feedback
  webinar.feedback.push({
    user: req.user.id,
    rating,
    feedback,
    submittedOn: Date.now()
  });
  
  await webinar.save();
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Feedback submitted successfully'
    }
  });
});

// @desc    Sync webinar with Zoom
// @route   POST /api/webinars/:id/sync-zoom
// @access  Private/Admin
const syncWithZoom = asyncHandler(async (req, res) => {
  const webinar = await Webinar.findById(req.params.id);
  
  if (!webinar) {
    return res.status(404).json({
      success: false,
      error: 'Webinar not found'
    });
  }
  
  // Check if webinar has Zoom ID
  if (!webinar.zoomMeetingId) {
    return res.status(400).json({
      success: false,
      error: 'Webinar does not have Zoom integration'
    });
  }
  
  // Check if Zoom integration is enabled
  if (process.env.ZOOM_INTEGRATION_ENABLED !== 'true') {
    return res.status(400).json({
      success: false,
      error: 'Zoom integration is not enabled'
    });
  }
  
  try {
    // Get details from Zoom
    const zoomWebinar = await zoomService.getWebinarDetails(webinar.zoomMeetingId);
    
    // Update webinar with Zoom details
    webinar.title = zoomWebinar.topic || webinar.title;
    webinar.description = zoomWebinar.agenda || webinar.description;
    webinar.startDate = zoomWebinar.start_time ? new Date(zoomWebinar.start_time) : webinar.startDate;
    webinar.duration = zoomWebinar.duration || webinar.duration;
    webinar.timezone = zoomWebinar.timezone || webinar.timezone;
    webinar.joinUrl = zoomWebinar.join_url || webinar.joinUrl;
    
    // If webinar is completed, sync attendance
    if (webinar.status === 'Completed') {
      // Get attendance from Zoom
      const attendees = await zoomService.getWebinarAttendees(webinar.zoomMeetingId);
      
      // Map emails to user registrations
      const emailToRegistrationIndex = {};
      
      webinar.registrations.forEach((reg, index) => {
        if (reg.user) {
          const user = await User.findById(reg.user).select('email');
          if (user && user.email) {
            emailToRegistrationIndex[user.email.toLowerCase()] = index;
          }
        }
      });
      
      // Mark attendance based on Zoom data
      let attendanceCount = 0;
      
      attendees.forEach(attendee => {
        const email = attendee.email.toLowerCase();
        if (emailToRegistrationIndex[email] !== undefined) {
          const index = emailToRegistrationIndex[email];
          webinar.registrations[index].attended = true;
          attendanceCount++;
        }
      });
    }
    
    await webinar.save();
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Webinar synchronized with Zoom successfully',
        attendanceUpdated: webinar.status === 'Completed'
      }
    });
  } catch (error) {
    console.error('Error syncing with Zoom:', error);
    res.status(500).json({
      success: false,
      error: 'Error syncing with Zoom: ' + error.message
    });
  }
});

// @desc    Get webinar categories
// @route   GET /api/webinars/categories
// @access  Public
const getWebinarCategories = asyncHandler(async (req, res) => {
  const categories = await Webinar.distinct('category');
  
  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

module.exports = {
  getWebinars,
  getWebinar,
  createWebinar,
  updateWebinar,
  deleteWebinar,
  registerForWebinar,
  cancelRegistration,
  markAttendance,
  submitFeedback,
  syncWithZoom,
  getWebinarCategories
};
