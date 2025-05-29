import mongoose, { Schema } from "mongoose";

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
  taxId: string; // Encrypted SSN or EIN
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
  dateSigned: Date;
  pdfUrl?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IW9FormDocument extends IW9Form, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export interface IW9FormModel extends mongoose.Model<IW9FormDocument> {
  findByContractor(
    contractorId: mongoose.Types.ObjectId,
  ): Promise<IW9FormDocument | null>;
  findPendingForms(): Promise<IW9FormDocument[]>;
  findByStatus(status: string): Promise<IW9FormDocument[]>;
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
      maxlength: 200,
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
      maxlength: 100,
      validate: {
        validator: function (this: IW9FormDocument, v: string) {
          return (
            this.taxClassification !== "other" ||
            Boolean(v && v.trim().length > 0)
          );
        },
        message:
          'Tax classification other description is required when classification is "other"',
      },
    },
    taxId: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          // This will be encrypted, so we validate the decrypted format in the service layer
          return Boolean(v && v.length > 0);
        },
        message: "Tax ID is required",
      },
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },
      city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },
      state: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2,
        uppercase: true,
      },
      zipCode: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: function (v: string) {
            return /^\d{5}(-\d{4})?$/.test(v);
          },
          message: "Invalid ZIP code format",
        },
      },
    },
    requestorInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },
      address: {
        street: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },
        city: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
        state: {
          type: String,
          required: true,
          trim: true,
          maxlength: 2,
          uppercase: true,
        },
        zipCode: {
          type: String,
          required: true,
          trim: true,
          validate: {
            validator: function (v: string) {
              return /^\d{5}(-\d{4})?$/.test(v);
            },
            message: "Invalid ZIP code format",
          },
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
        default: false,
      },
    },
    exemptPayeeCodes: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.every((code) => /^[1-9]|1[0-4]$/.test(code));
        },
        message: "Invalid exempt payee code",
      },
    },
    fatcaReportingCode: {
      type: String,
      trim: true,
      maxlength: 10,
    },
    signature: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    dateSigned: {
      type: Date,
      required: true,
      validate: {
        validator: function (v: Date) {
          return v <= new Date();
        },
        message: "Date signed cannot be in the future",
      },
    },
    pdfUrl: {
      type: String,
      trim: true,
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
  },
  {
    timestamps: true,
  },
);

// Validation for status transitions
W9FormSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    const now = new Date();
    const doc = this as IW9FormDocument;

    switch (doc.status) {
      case "submitted":
        if (!doc.submittedAt) {
          doc.submittedAt = now;
        }
        break;
      case "approved":
        if (!doc.approvedAt) {
          doc.approvedAt = now;
        }
        break;
      case "rejected":
        if (!doc.rejectedAt) {
          doc.rejectedAt = now;
        }
        if (!doc.rejectionReason) {
          return next(
            new Error("Rejection reason is required when status is rejected"),
          );
        }
        break;
    }
  }
  next();
});

// Static methods
W9FormSchema.statics.findByContractor = function (
  contractorId: mongoose.Types.ObjectId,
) {
  return this.findOne({ contractorId }).sort({ createdAt: -1 });
};

W9FormSchema.statics.findPendingForms = function () {
  return this.find({ status: "submitted" })
    .populate("contractorId", "name email")
    .sort({ submittedAt: 1 });
};

W9FormSchema.statics.findByStatus = function (status: string) {
  return this.find({ status })
    .populate("contractorId", "name email")
    .sort({ createdAt: -1 });
};

// Indexes
W9FormSchema.index({ contractorId: 1, status: 1 });
W9FormSchema.index({ status: 1, submittedAt: 1 });
W9FormSchema.index({ createdAt: -1 });

export default mongoose.model<IW9FormDocument, IW9FormModel>(
  "W9Form",
  W9FormSchema,
);
