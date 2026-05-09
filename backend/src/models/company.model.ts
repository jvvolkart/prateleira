import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export type CompanyDoc = mongoose.InferSchemaType<typeof companySchema>;
export const Company = mongoose.model("Company", companySchema);
