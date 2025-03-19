import mongoose, { Schema } from "mongoose";
import { IBlogDocument, IBlogModel } from "../types/blog";
import slugify from "slugify";

// Define the image schema
const ImageSchema = new Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  mimetype: String,
  size: Number,
});

// Define the meta schema
const MetaSchema = new Schema({
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
});

// Define the SEO schema
const SeoSchema = new Schema({
  metaTitle: String,
  metaDescription: String,
  focusKeyword: String,
});

// Define the main blog schema
const BlogSchema = new Schema<IBlogDocument, IBlogModel>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    introduction: {
      type: String,
      required: [true, "Introduction is required"],
    },
    body: {
      type: String,
      required: [true, "Body content is required"],
    },
    conclusion: {
      type: String,
      required: [true, "Conclusion is required"],
    },
    images: [ImageSchema],
    excerpt: String,
    featuredImage: String,
    categories: {
      type: [String],
      default: [],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishDate: String,
    lastModified: {
      type: String,
      default: () => new Date().toISOString(),
    },
    meta: {
      type: MetaSchema,
      default: () => ({}),
    },
    seo: SeoSchema,
    readTime: {
      type: Number,
      default: 0,
    },
    isFeature: {
      type: Boolean,
      default: false,
    },
    relatedPosts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Blog",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to generate slug and calculate read time
BlogSchema.pre("save", async function (next) {
  // Update lastModified date
  this.lastModified = new Date().toISOString();

  // Generate slug if title is modified
  if (this.isModified("title")) {
    this.slug = await this.generateSlug();
  }

  // Calculate read time if content is modified
  if (
    this.isModified("introduction") ||
    this.isModified("body") ||
    this.isModified("conclusion")
  ) {
    this.readTime = this.calculateReadTime();
  }

  next();
});

// Method to generate unique slug
BlogSchema.methods.generateSlug = async function (): Promise<string> {
  const baseSlug = slugify(this.title, { lower: true });

  // Check if slug exists
  const BlogModel = this.constructor as IBlogModel;
  const slugExists = await BlogModel.findOne({
    slug: baseSlug,
    _id: { $ne: this._id },
  });

  if (!slugExists) return baseSlug;

  // If slug exists, append a random string
  return `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
};

// Method to calculate read time
BlogSchema.methods.calculateReadTime = function (): number {
  const text = `${this.introduction} ${this.body} ${this.conclusion}`;
  const wordCount = text.split(/\s+/).length;
  const wordsPerMinute = 200; // Average reading speed

  return Math.ceil(wordCount / wordsPerMinute);
};

// Static methods
BlogSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug }).populate("author", "name");
};

BlogSchema.statics.findByCategory = function (category: string) {
  return this.find({ categories: category, status: "published" }).sort({
    publishDate: -1,
  });
};

BlogSchema.statics.findByTag = function (tag: string) {
  return this.find({ tags: tag, status: "published" }).sort({
    publishDate: -1,
  });
};

BlogSchema.statics.findPublished = function () {
  return this.find({ status: "published" }).sort({ publishDate: -1 });
};

BlogSchema.statics.searchBlogs = function (query: string) {
  // Use exact phrase search by wrapping the query in quotes
  const exactQuery = `"${query}"`;
  return this.find(
    { $text: { $search: exactQuery }, status: "published" },
    { score: { $meta: "textScore" } },
  ).sort({ score: { $meta: "textScore" } });
};

// Create text index for searching
BlogSchema.index({
  title: "text",
  introduction: "text",
  body: "text",
  conclusion: "text",
  tags: "text",
});

// Check if the model exists before creating a new one
const Blog =
  (mongoose.models.Blog as IBlogModel) ||
  mongoose.model<IBlogDocument, IBlogModel>("Blog", BlogSchema);

export default Blog;
