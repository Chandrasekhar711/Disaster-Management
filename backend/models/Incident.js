import mongoose from 'mongoose';

const verificationHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'real', 'fake'],
      default: 'pending',
    },
    verificationNotes: {
      type: String,
      maxlength: [2000, 'Verification notes cannot exceed 2000 characters'],
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'verifiedByModel',
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const verificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'real', 'fake'],
      default: 'pending',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'verification.verifiedByModel',
      default: null,
    },
    verifiedByModel: {
      type: String,
      enum: ['Admin', 'Authority'],
      default: null,
    },
    verifiedAt: Date,
    verificationNotes: {
      type: String,
      maxlength: [2000, 'Verification notes cannot exceed 2000 characters'],
    },
    history: {
      type: [verificationHistorySchema],
      default: [],
    },
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide incident title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide incident description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: ['flood', 'fire', 'accident', 'earthquake', 'hazard', 'other'],
      required: [true, 'Please specify incident type'],
    },
    customType: {
      type: String,
      trim: true,
      maxlength: [100, 'Custom type cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: ['reported', 'admin_review', 'authority_review', 'responding', 'responded', 'resolved', 'cancelled'],
      default: 'reported',
    },
    adminReviewed: {
      type: Boolean,
      default: false,
    },
    authorityVerified: {
      type: Boolean,
      default: false,
    },
    verificationDecision: {
      type: String,
      enum: ['yes', 'no', null],
      default: null,
    },
    adminReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    authorityVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Authority',
      default: null,
    },
    verificationNotes: String,
    verification: {
      type: verificationSchema,
      default: () => ({ status: 'pending', history: [] }),
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        default: '',
      },
    },
    media: [
      {
        url: String,
        type: {
          type: String,
          enum: ['image', 'video'],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
      },
    ],
    // Media Upload System Fields
    uploadMethod: {
      type: String,
      enum: ['none', 'file_upload', 'camera_capture'],
      default: 'none',
    },
    aiVerification: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
      isRealImage: {
        type: Boolean,
        default: null,
      },
      verifiedAt: Date,
      rawResponse: mongoose.Schema.Types.Mixed,
    },
    routingDestination: {
      type: String,
      enum: ['verification_team', 'responding_team'],
      default: 'verification_team',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'reportedByModel',
      required: true,
    },
    reportedByModel: {
      type: String,
      enum: ['Citizen', 'Admin', 'Authority'],
      default: 'Citizen',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'verifiedByModel',
      default: null,
    },
    verifiedByModel: {
      type: String,
      enum: ['Admin', 'Authority'],
      default: null,
    },
    assignedTo: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Authority',
        },
        department: String,
        assignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    responders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Authority',
      },
    ],
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'comments.authorModel',
        },
        authorModel: {
          type: String,
          enum: ['Citizen', 'Admin', 'Authority'],
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isSOS: {
      type: Boolean,
      default: false,
    },
    whatsappAlertSentAt: {
      type: Date,
      default: null,
    },
    whatsappAlertReason: {
      type: String,
      default: null,
    },
    sosTriggeredAt: Date,
    sosTriggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Citizen',
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    affectedPeople: {
      type: Number,
      default: 0,
    },
    estimatedDamage: {
      type: String,
      enum: ['minimal', 'moderate', 'severe', 'catastrophic'],
      default: 'moderate',
    },
    resolutionNotes: String,
    resolvedAt: Date,
    respondedAt: Date,
    priority: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Geospatial index for location queries
incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ type: 1 });
incidentSchema.index({ reportedBy: 1 });

// Virtual for days active
incidentSchema.virtual('daysActive').get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diff = now - created;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Method to find incidents near a location
incidentSchema.statics.findNearby = function (coordinates, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates, // [longitude, latitude]
        },
        $maxDistance: maxDistance,
      },
    },
  });
};

// Method to get incident statistics
incidentSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgAffected: { $avg: '$affectedPeople' },
      },
    },
  ]);
  return stats;
};

export default mongoose.model('Incident', incidentSchema);
