import {
  ensureDirSync,
  ensureFileSync,
  readJsonSync,
  writeJSONSync,
} from "fs-extra";
import { join } from "path";

export default class JsonStore<T> {
  data: T;
  filename: string;
  dirPath: string;
  filePath: string;

  constructor(filename: string, data: T | null = null) {
    if (data) this.data = data;
    this.filename = filename;
    this.dirPath = join(process.cwd(), "data", "stores");
    this.filePath = join(
      this.dirPath,
      `${this.filename}${this.filename.endsWith(".json") ? "" : ".json"}`,
    );

    ensureDirSync(this.dirPath);
    ensureFileSync(this.filePath);

    if (this.data) {
      this.writeData();
    } else if (!this.data || (this.data as Object)[0] === undefined) {
      this.clearJson();
    }
  }

  getDirPath(): string {
    return this.dirPath;
  }

  getFilePath(): string {
    return this.getFilePath();
  }

  writeJson<T extends typeof this.data>(data: T): boolean {
    try {
      this.data = data;
      this.writeData();
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  getJson(): typeof this.data {
    return readJsonSync(this.filePath, {
      encoding: "utf8",
    }) as typeof this.data;
  }

  push(data: any): typeof this.data {
    if ((this.data as any[])?.length) {
      this.data = [...(this.data as any[]), ...data] as any;
    }

    this.writeData();
    return this.data;
  }

  clearJson(array: boolean = false): void {
    if (array) {
      this.data = [] as any;
    } else {
      this.data = {} as any;
    }

    this.writeData();
  }

  private writeData(): void {
    writeJSONSync(this.filePath, this.data, { encoding: "utf8" });
  }
}
