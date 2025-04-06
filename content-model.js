const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add content title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    contentType: {
      type: String,
      required: true,
      enum: ['Video', 'Document', 'Presentation', 'Quiz', 'Assignment', 'Link']
    },
    // For Video content
    videoUrl: {
      type: String,
      required: function() {
        return this.contentType === 'Video';
      }
    },
    videoDuration: {
      type: Number, // in seconds
      required: function() {
        return this.contentType === 'Video';
      }
    },
    // For Document content
    documentUrl: {
      type: String,
      required: function() {
        return this.contentType === 'Document';
      }
    },
    // For Presentation content
    presentationUrl: {
      type: String,
      required: function() {
        return this.contentType === 'Presentation';
      }
    },
    // For Assignment content
    assignment: {
      instructions: {
        type: String,
        required: function() {
          return this.contentType === 'Assignment';
        }
      },
      deadline: {
        type: Date,
        required: function() {
          return this.contentType === 'Assignment';
        }
      },
      submissionType: {
        type: String,
        enum: ['Text', 'File', 'Link'],
        required: function() {
          return this.contentType === 'Assignment';
        }
      },
      maxScore: {
        type: Number,
        default: 100,
        required: function() {
          return this.contentType === 'Assignment';
        }
      }
    },
    // For external link content
    externalLink: {
      type: String,
      required: function() {
        return this.contentType === 'Link';
      }
    },
    // Tracking completions
    requiredToComplete: {
      type: Boolean,
      default: true
    },
    isPublished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Content', ContentSchema);
