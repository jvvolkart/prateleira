import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export type ProductDoc = mongoose.InferSchemaType<typeof productSchema>;
export const Product = mongoose.model("Product", productSchema);
