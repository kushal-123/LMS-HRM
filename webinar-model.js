const mongoose = require('mongoose');

const WebinarSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a webinar title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    startDate: {
      type: Date,
      required: [true, 'Please add a start date and time']
    },
    endDate: {
      type: Date,
      required: [true, 'Please add an end date and time']
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'Please add webinar duration']
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    type: {
      type: String,
      enum: ['Live', 'Recorded', 'Hybrid'],
      default: 'Live'
    },
    presenter: {
      name: {
        type: String,
        required: [true, 'Please add presenter name']
      },
      title: String,
      bio: String,
      imageUrl: String,
      email: String
    },
    skillsRelated: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    }],
    category: {
      type: String,
      required: [true, 'Please specify a category']
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels'
    },
    zoomMeetingId: {
      type: String
    },
    zoomPassword: {
      type: String
    },
    joinUrl: {
      type: String
    },
    hostUrl: {
      type: String
    },
    isRecorded: {
      type: Boolean,
      default: false
    },
    recordingUrl: {
      type: String
    },
    thumbnailUrl: {
      type: String,
      default: 'default-webinar.jpg'
    },
    capacity: {
      type: Number,
      default: 100
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    registrations: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      registeredOn: {
        type: Date,
        default: Date.now
      },
      registrantId: String,
      registrantJoinUrl: String,
      attended: {
        type: Boolean,
        default: false
      },
      feedbackSubmitted: {
        type: Boolean,
        default: false
      }
    }],
    targetDepartments: [{
      type: String
    }],
    targetRoles: [{
      type: String
    }],
    relatedCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Scheduled'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    resources: [{
      title: String,
      description: String,
      fileUrl: String,
      type: {
        type: String,
        enum: ['Document', 'Presentation', 'Link', 'Video'],
        default: 'Document'
      }
    }],
    additionalInformation: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient queries
WebinarSchema.index({ startDate: 1 });
WebinarSchema.index({ status: 1 });
WebinarSchema.index({ isPublished: 1 });
WebinarSchema.index({ category: 1 });

// Virtual for registration count
WebinarSchema.virtual('registrationCount').get(function() {
  return this.registrations ? this.registrations.length : 0;
});

// Virtual for attendance count
WebinarSchema.virtual('attendanceCount').get(function() {
  if (!this.registrations) return 0;
  return this.registrations.filter(reg => reg.attended).length;
});

// Virtual for attendance rate
WebinarSchema.virtual('attendanceRate').get(function() {
  const attendees = this.attendanceCount;
  const registrations = this.registrationCount;
  
  if (registrations === 0) return 0;
  return Math.round((attendees / registrations) * 100);
});

// Virtual for days until webinar
WebinarSchema.virtual('daysUntil').get(function() {
  const now = new Date();
  const start = new Date(this.startDate);
  
  // Get time difference in days
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Set status automatically before save
WebinarSchema.pre('save', function(next) {
  const now = new Date();
  const startDate = new Date(this.startDate);
  const endDate = new Date(this.endDate);
  
  if (startDate > now) {
    this.status = 'Scheduled';
  } else if (startDate <= now && endDate >= now) {
    this.status = 'In Progress';
  } else if (endDate < now) {
    this.status = 'Completed';
  }
  
  next();
});

module.exports = mongoose.model('Webinar', WebinarSchema);
