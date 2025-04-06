/**
 * Notification service
 * Handles sending and managing notifications for LMS activities
 */
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('../models/User');
require('dotenv').config();

// Create a notification schema if it doesn't exist
let Notification;
try {
  Notification = mongoose.model('Notification');
} catch (error) {
  const NotificationSchema = new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      title: {
        type: String,
        required: true
      },
      message: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: [
          'course_enrollment',
          'course_completion',
          'quiz_result',
          'assignment_feedback',
          'due_date_reminder',
          'certificate_issued',
          'badge_earned',
          'webinar_reminder',
          'learning_recommendation',
          'system_announcement'
        ],
        required: true
      },
      isRead: {
        type: Boolean,
        default: false
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed
      }
    },
    {
      timestamps: true
    }
  );
  
  Notification = mongoose.model('Notification', NotificationSchema);
}

// Email transport configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send a notification to a user
 * @param {string} userId - ID of the user to notify
 * @param {string} title - Title of the notification
 * @param {string} message - Content of the notification
 * @param {Object} options - Additional options
 * @returns {Object} - Created notification
 */
const sendNotification = async (userId, title, message, options = {}) => {
  try {
    // Get the notification type
    const type = options.type || 'system_announcement';
    
    // Create notification in database
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      metadata: options.metadata || {}
    });
    
    // Check if email notification is needed
    const user = await User.findById(userId);
    
    if (user && user.notificationPreferences && user.notificationPreferences[type]) {
      // Handle based on user's notification preferences
      if (user.notificationPreferences[type].email && user.email) {
        await sendEmailNotification(user.email, title, message, type, options);
      }
      
      // Handle push notifications if configured
      if (user.notificationPreferences[type].push && user.pushToken) {
        await sendPushNotification(user.pushToken, title, message, type, options);
      }
    } else {
      // Default: send email for important notifications
      const importantTypes = ['course_completion', 'certificate_issued', 'due_date_reminder'];
      
      if (importantTypes.includes(type) && user && user.email) {
        await sendEmailNotification(user.email, title, message, type, options);
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error.message);
    throw error;
  }
};

/**
 * Send an email notification
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @param {string} type - Notification type
 * @param {Object} options - Additional options
 */
const sendEmailNotification = async (email, subject, message, type, options = {}) => {
  try {
    // Get email template based on type
    const emailTemplate = getEmailTemplate(type, subject, message, options);
    
    // Send the email
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || '"LMS System" <lms@example.com>',
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });
    
    console.log(`Email notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending email notification:', error.message);
    // Don't throw - notification should still be created even if email fails
  }
};

/**
 * Send a push notification
 * @param {string} pushToken - User's push notification token
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {Object} options - Additional options
 */
const sendPushNotification = async (pushToken, title, message, type, options = {}) => {
  try {
    // This is a placeholder for push notification implementation
    // In a real application, you would use FCM, APNS, or a push service
    
    console.log(`Push notification would be sent to token: ${pushToken}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    console.log(`Type: ${type}`);
    
    // Pretend we sent it successfully
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error.message);
    // Don't throw - notification should still be created even if push fails
    return false;
  }
};

/**
 * Get email template based on notification type
 * @param {string} type - Notification type
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @param {Object} options - Additional options
 * @returns {Object} - Email template with subject and HTML content
 */
const getEmailTemplate = (type, subject, message, options = {}) => {
  // Base template with common styling
  const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
        }
        .header {
          background-color: #4a6cf7;
          color: white;
          padding: 15px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .footer {
          text-align: center;
          padding: 15px;
          font-size: 12px;
          color: #777;
          border-top: 1px solid #e0e0e0;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #4a6cf7;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>{{subject}}</h2>
        </div>
        <div class="content">
          {{content}}
        </div>
        <div class="footer">
          <p>This is an automated message from the LMS system. Please do not reply to this email.</p>
          <p>If you wish to update your notification preferences, please visit your profile settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Default values
  let emailSubject = subject;
  let emailContent = `<p>${message}</p>`;
  
  // Customize based on notification type
  switch (type) {
    case 'course_enrollment':
      emailContent = `
        <p>Hello,</p>
        <p>${message}</p>
        <p>You can start your learning journey by clicking the button below:</p>
        <p><a href="${process.env.FRONTEND_URL}/lms/courses/${options.metadata?.courseId}" class="button">Go to Course</a></p>
      `;
      break;
      
    case 'course_completion':
      emailContent = `
        <p>Congratulations!</p>
        <p>${message}</p>
        <p>Your certificate has been issued and is available in your profile.</p>
        <p><a href="${process.env.FRONTEND_URL}/lms/certificates" class="button">View Certificate</a></p>
      `;
      break;
      
    case 'certificate_issued':
      emailContent = `
        <p>Congratulations!</p>
        <p>${message}</p>
        <p>You can download your certificate by clicking the button below:</p>
        <p><a href="${process.env.FRONTEND_URL}${options.metadata?.certificateUrl}" class="button">Download Certificate</a></p>
      `;
      break;
      
    case 'due_date_reminder':
      emailContent = `
        <p>Hello,</p>
        <p>${message}</p>
        <p>Please complete your assigned courses before the due date.</p>
        <p><a href="${process.env.FRONTEND_URL}/lms/courses" class="button">View My Courses</a></p>
      `;
      break;
      
    case 'webinar_reminder':
      const webinarDate = options.metadata?.webinarDate 
        ? new Date(options.metadata.webinarDate).toLocaleString() 
        : 'soon';
        
      emailContent = `
        <p>Hello,</p>
        <p>${message}</p>
        <p>The webinar is scheduled for: <strong>${webinarDate}</strong></p>
        <p>Join the webinar by clicking the button below at the scheduled time:</p>
        <p><a href="${options.metadata?.webinarLink || process.env.FRONTEND_URL}/lms/webinars" class="button">Join Webinar</a></p>
      `;
      break;
      
    // Default case already handled with base values
  }
  
  // Replace template variables
  const html = baseTemplate
    .replace('{{subject}}', emailSubject)
    .replace('{{content}}', emailContent);
  
  return {
    subject: emailSubject,
    html
  };
};

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {Object} options - Query options (limit, page, unread)
 * @returns {Array} - User notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const limit = parseInt(options.limit) || 10;
    const page = parseInt(options.page) || 1;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { user: userId };
    
    // Filter for unread notifications if specified
    if (options.unread === 'true') {
      query.isRead = false;
    }
    
    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    return {
      data: notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting user notifications:', error.message);
    throw error;
  }
};

/**
 * Mark notifications as read
 * @param {string} userId - User ID
 * @param {string|Array} notificationIds - Single ID or array of notification IDs to mark as read
 * @returns {number} - Number of notifications updated
 */
const markNotificationsAsRead = async (userId, notificationIds) => {
  try {
    let query = { user: userId };
    
    // If specific notification IDs provided
    if (notificationIds) {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      query._id = { $in: ids };
    }
    
    // Update notifications
    const result = await Notification.updateMany(
      query,
      { $set: { isRead: true } }
    );
    
    return result.nModified;
  } catch (error) {
    console.error('Error marking notifications as read:', error.message);
    throw error;
  }
};

/**
 * Send due date reminder notifications
 * For courses nearing their due dates
 */
const sendDueDateReminders = async () => {
  try {
    const Enrollment = mongoose.model('Enrollment');
    
    // Get current date
    const now = new Date();
    
    // Find enrollments with due dates coming up in 3 days
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);
    
    // Find enrollments with upcoming due dates that are not completed
    const upcomingEnrollments = await Enrollment.find({
      status: { $ne: 'Completed' },
      dueDate: {
        $gte: now,
        $lte: threeDaysFromNow
      }
    }).populate('user course');
    
    console.log(`Found ${upcomingEnrollments.length} enrollments with upcoming due dates`);
    
    // Send reminders for each enrollment
    for (const enrollment of upcomingEnrollments) {
      // Skip if user or course not populated
      if (!enrollment.user || !enrollment.course) continue;
      
      const daysRemaining = Math.ceil((enrollment.dueDate - now) / (1000 * 60 * 60 * 24));
      
      await sendNotification(
        enrollment.user._id,
        'Course Due Date Reminder',
        `Your course "${enrollment.course.title}" is due in ${daysRemaining} days. Please complete it by ${enrollment.dueDate.toLocaleDateString()}.`,
        {
          type: 'due_date_reminder',
          metadata: {
            courseId: enrollment.course._id,
            enrollmentId: enrollment._id,
            dueDate: enrollment.dueDate
          }
        }
      );
      
      console.log(`Due date reminder sent for user ${enrollment.user._id} for course ${enrollment.course.title}`);
    }
    
    return upcomingEnrollments.length;
  } catch (error) {
    console.error('Error sending due date reminders:', error.message);
    throw error;
  }
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markNotificationsAsRead,
  sendDueDateReminders
};
