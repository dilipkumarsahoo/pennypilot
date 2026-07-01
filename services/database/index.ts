import { Platform } from "react-native";
import { getDatabase } from "./connection";
import { runMigrations } from "./migration";
import { getAllDataAsJson } from "./repositories";

let initPromise: Promise<boolean> | null = null;

export async function initDatabase(): Promise<boolean> {
  if (Platform.OS === "web") {
    return true;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await getDatabase();
      await runMigrations(db);
      console.log("Database initialized successfully");
      return true;
    } catch (error) {
      initPromise = null;
      console.error("Error initializing database:", error);
      throw error;
    }
  })();

  return initPromise;
}

export async function exportAllData(): Promise<Record<string, unknown>> {
  if (Platform.OS === "web") {
    return {};
  }
  const db = await getDatabase();
  return getAllDataAsJson(db);
}

export { getDatabase } from "./connection";
