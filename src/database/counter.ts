import { Schema, model, models } from 'mongoose';

interface CounterDoc {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDoc>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

const Counter = models.Counter || model<CounterDoc>('Counter', counterSchema, 'counters');

export async function nextId(name: string): Promise<number> {
  const row = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean<CounterDoc>();
  return Number(row?.seq ?? 1);
}
