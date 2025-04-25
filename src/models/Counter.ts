import mongoose, { Schema } from "mongoose";

// Define the interface for the counter document
export interface ICounterDocument extends mongoose.Document {
  _id: string;
  seq: number;
}

// Define the interface for the counter model
export interface ICounterModel extends mongoose.Model<ICounterDocument> {
  getNextSequence(name: string): Promise<number>;
}

// Define the counter schema
const CounterSchema = new Schema<ICounterDocument, ICounterModel>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

// Add a static method to get the next sequence
CounterSchema.statics.getNextSequence = async function(name: string): Promise<number> {
  const result = await this.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result.seq;
};

// Use existing model if available (for Next.js hot reloading)
let CounterModel: ICounterModel;

// Check if the model already exists to prevent model overwrite error during hot reloading
if (mongoose.models.Counter) {
  CounterModel = mongoose.models.Counter as unknown as ICounterModel;
} else {
  CounterModel = mongoose.model<ICounterDocument, ICounterModel>("Counter", CounterSchema);
}

export default CounterModel;
