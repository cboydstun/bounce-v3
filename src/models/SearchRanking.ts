import mongoose, { Schema, Document, Model } from "mongoose";

// Define competitor schema
const CompetitorSchema = new Schema({
  position: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  snippet: String,
});

export interface ISearchRankingDocument extends Document {
  keywordId: mongoose.Types.ObjectId;
  keyword: string;
  date: Date;
  position: number;
  url: string;
  competitors: Array<{
    position: number;
    title: string;
    url: string;
    snippet?: string;
  }>;
  metadata?: {
    totalResults: string;
    searchTime: string;
    resultCount: number;
    isValidationPassed: boolean;
    validationWarnings: string[];
    apiCallsUsed?: number;
    searchDepth?: number;
    maxPositionSearched?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ISearchRankingModel extends Model<ISearchRankingDocument> {
  findByKeywordId(keywordId: string): Promise<ISearchRankingDocument[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<ISearchRankingDocument[]>;
  findLatestRankings(): Promise<ISearchRankingDocument[]>;
}

const SearchRankingSchema = new Schema<
  ISearchRankingDocument,
  ISearchRankingModel
>(
  {
    keywordId: {
      type: Schema.Types.ObjectId,
      ref: "SearchKeyword",
      required: true,
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    position: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    competitors: [CompetitorSchema],
    metadata: {
      totalResults: String,
      searchTime: String,
      resultCount: Number,
      isValidationPassed: Boolean,
      validationWarnings: [String],
      apiCallsUsed: Number,
      searchDepth: Number,
      maxPositionSearched: Number,
    },
  },
  { timestamps: true },
);

// Static methods
SearchRankingSchema.statics.findByKeywordId = function (keywordId: string) {
  return this.find({ keywordId }).sort({ date: -1 });
};

SearchRankingSchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date,
) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: -1 });
};

SearchRankingSchema.statics.findLatestRankings = function () {
  return this.aggregate([
    {
      $sort: { date: -1 },
    },
    {
      $group: {
        _id: "$keywordId",
        doc: { $first: "$$ROOT" },
      },
    },
    {
      $replaceRoot: { newRoot: "$doc" },
    },
  ]);
};

// Create indexes for better query performance
SearchRankingSchema.index({ keywordId: 1, date: -1 });
SearchRankingSchema.index({ keyword: 1, date: -1 });

export default (mongoose.models.SearchRanking as ISearchRankingModel) ||
  mongoose.model<ISearchRankingDocument, ISearchRankingModel>(
    "SearchRanking",
    SearchRankingSchema,
  );
