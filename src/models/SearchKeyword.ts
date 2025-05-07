import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISearchKeywordDocument extends Document {
  keyword: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISearchKeywordModel extends Model<ISearchKeywordDocument> {
  findActiveKeywords(): Promise<ISearchKeywordDocument[]>;
}

const SearchKeywordSchema = new Schema<ISearchKeywordDocument, ISearchKeywordModel>(
  {
    keyword: {
      type: String,
      required: [true, "Keyword is required"],
      trim: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Static method to find active keywords
SearchKeywordSchema.statics.findActiveKeywords = function() {
  return this.find({ isActive: true });
};

export default (mongoose.models.SearchKeyword as ISearchKeywordModel) || 
  mongoose.model<ISearchKeywordDocument, ISearchKeywordModel>("SearchKeyword", SearchKeywordSchema);
