import mongoose, { Document, Schema } from "mongoose";

export interface IW9Form {
  contractorId: mongoose.Types.ObjectId;
  businessName: string;
  taxClassification:
    | "individual"
    | "c-corp"
    | "s-corp"
    | "partnership"
    | "trust"
    | "llc"
    | "other";
  taxClassificationOther?: string;
  taxId: string; // Encrypted
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  requestorInfo: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  certifications: {
    taxIdCorrect: boolean;
    notSubjectToBackupWithholding: boolean;
    usCitizenOrResident: boolean;
    fatcaExempt: boolean;
  };
  exemptPayeeCodes?: string[];
  fatcaReportingCode?: string;
  signature: string;
  signatureDate: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  pdfPath?: string;
  hasPdf: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IW9FormDocument extends IW9Form, Document {
  canBeModified(): boolean;
  canBeSubmitted(): boolean;
  isComplete(): boolean;
}

export interface IW9FormModel extends mongoose.Model<IW9FormDocument> {
  findByContractor(
    contractorId: mongoose.Types.ObjectId,
  ): Promise<IW9FormDocument | null>;
  findActiveByContractor(
    contractorId: mongoose.Types.ObjectId,
  ): Promise<IW9FormDocument | null>;
}

const W9FormSchema = new Schema<IW9FormDocument, IW9FormModel>(
  {
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: "ContractorAuth",
      required: true,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    taxClassification: {
      type: String,
      required: true,
      enum: [
        "individual",
        "c-corp",
        "s-corp",
        "partnership",
        "trust",
        "llc",
        "other",
      ],
    },
    taxClassificationOther: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    taxId: {
      type: String,
      required: true,
      // This will be encrypted before storage
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },
      city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
      },
      state: {
        type: String,
        required: true,
        trim: true,
        length: 2,
        uppercase: true,
      },
      zipCode: {
        type: String,
        required: true,
        trim: true,
        match: /^\d{5}(-\d{4})?$/,
      },
    },
    requestorInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },
      address: {
        street: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
        city: {
          type: String,
          required: true,
          trim: true,
          maxlength: 50,
        },
        state: {
          type: String,
          required: true,
          trim: true,
          length: 2,
          uppercase: true,
        },
        zipCode: {
          type: String,
          required: true,
          trim: true,
          match: /^\d{5}(-\d{4})?$/,
        },
      },
    },
    certifications: {
      taxIdCorrect: {
        type: Boolean,
        required: true,
      },
      notSubjectToBackupWithholding: {
        type: Boolean,
        required: true,
      },
      usCitizenOrResident: {
        type: Boolean,
        required: true,
      },
      fatcaExempt: {
        type: Boolean,
        required: true,
      },
    },
    exemptPayeeCodes: [
      {
        type: String,
        trim: true,
        maxlength: 10,
      },
    ],
    fatcaReportingCode: {
      type: String,
      trim: true,
      maxlength: 10,
    },
    signature: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    signatureDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    status: {
      type: String,
      required: true,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
      index: true,
    },
    submittedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    pdfPath: {
      type: String,
      trim: true,
    },
    hasPdf: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
W9FormSchema.index({ contractorId: 1, status: 1 });
W9FormSchema.index({ contractorId: 1, createdAt: -1 });

// Validation middleware
W9FormSchema.pre("save", function (next) {
  // Ensure taxClassificationOther is provided when taxClassification is 'other'
  if (this.taxClassification === "other" && !this.taxClassificationOther) {
    return next(
      new Error(
        'Tax classification other description is required when classification is "other"',
      ),
    );
  }

  // Set status-specific timestamps
  if (this.isModified("status")) {
    const now = new Date();
    switch (this.status) {
      case "submitted":
        if (!this.submittedAt) {
          this.submittedAt = now;
        }
        break;
      case "approved":
        if (!this.approvedAt) {
          this.approvedAt = now;
        }
        break;
      case "rejected":
        if (!this.rejectedAt) {
          this.rejectedAt = now;
        }
        break;
    }
  }

  next();
});

// Instance methods
W9FormSchema.methods.canBeModified = function (): boolean {
  return this.status === "draft" || this.status === "rejected";
};

W9FormSchema.methods.canBeSubmitted = function (): boolean {
  return this.status === "draft" || this.status === "rejected";
};

W9FormSchema.methods.isComplete = function (): boolean {
  return !!(
    this.businessName &&
    this.taxClassification &&
    this.taxId &&
    this.address?.street &&
    this.address?.city &&
    this.address?.state &&
    this.address?.zipCode &&
    this.requestorInfo?.name &&
    this.requestorInfo?.address?.street &&
    this.requestorInfo?.address?.city &&
    this.requestorInfo?.address?.state &&
    this.requestorInfo?.address?.zipCode &&
    this.certifications &&
    this.signature &&
    this.signatureDate
  );
};

// Static methods
W9FormSchema.statics.findByContractor = function (
  contractorId: mongoose.Types.ObjectId,
) {
  return this.findOne({ contractorId }).sort({ createdAt: -1 });
};

W9FormSchema.statics.findActiveByContractor = function (
  contractorId: mongoose.Types.ObjectId,
) {
  return this.findOne({
    contractorId,
    status: { $in: ["draft", "submitted", "approved"] },
  }).sort({ createdAt: -1 });
};

const W9Form = mongoose.model<IW9FormDocument, IW9FormModel>(
  "W9Form",
  W9FormSchema,
);

export default W9Form;
