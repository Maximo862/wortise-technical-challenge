import { connectToDatabase } from "./client";

async function main() {
  const db = await connectToDatabase();
  const collection = db.collection("_phase2_check");

  const insertResult = await collection.insertOne({ ok: true, at: new Date() });
  const found = await collection.findOne({ _id: insertResult.insertedId });

  console.log("Inserted:", insertResult.insertedId.toString());
  console.log("Read back:", found);

  await collection.deleteOne({ _id: insertResult.insertedId });
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
