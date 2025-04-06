const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Expired'],
      default: 'Not Started'
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedModules: [{
      module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
      },
      completedOn: {
        type: Date,
        default: Date.now
      },
      quizScore: {
        type: Number,
        default: 0
      },
      quizAttempts: {
        type: Number,
        default: 0
      }
    }],
    completedContent: [{
      content: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
      },
      completedOn: {
        type: Date,
        default: Date.now
      },
      timeSpent: {
        type: Number, // in seconds
        default: 0
      },
      // For assignment submissions
      assignmentSubmission: {
        submissionText: String,
        submissionFileUrl: String,
        submissionLink: String,
        submittedOn: Date,
        score: Number,
        feedback: String,
        status: {
          type: String,
          enum: ['Pending', 'Graded', 'Rejected'],
          default: 'Pending'
        }
      }
    }],
    certificateIssued: {
      type: Boolean,
      default: false
    },
    certificateUrl: {
      type: String
    },
    certificateIssuedOn: {
      type: Date
    },
    lastAccessedOn: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    requiredBy: {
      type: String // e.g., 'Department', 'Role', 'Manager'
    },
    pointsEarned: {
      type: Number,
      default: 0
    },
    badgesEarned: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    }]
  },
  {
    timestamps: true
  }
);

// Index for faster lookups of user enrollments
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
