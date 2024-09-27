import mongoose from "mongoose";
import { Schema, model } from "mongoose";

export const tiketCollectionName = "ticket";

const ticketSchema = new mongoose.Schema({
    code: { type: String, required: true },
    purchase_datetime: { type: String, required: true },
    amount: { type: Number, required: true },
    purchaser: { type: String, required: true },
});

export const TicketModel = mongoose.model(
    tiketCollectionName,
    ticketSchema
);