import {
  BaseDirectory,
  mkdir,
  readTextFile,
  writeTextFile,
  exists,
} from "@tauri-apps/plugin-fs";
import { Shape, shapeFromJSON } from "./shapes";
import type { LineAlg } from "./raster/RasterRenderer";

const PROJECTS_DIR = "VectorEngine/projects";
const INDEX_FILE = `${PROJECTS_DIR}/index.json`;
const BASE = { baseDir: BaseDirectory.Document } as const;

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData extends ProjectMeta {
  lineAlg: LineAlg;
  shapes: unknown[];
}

function projectFile(id: string): string {
  return `${PROJECTS_DIR}/${id}.json`;
}

async function ensureDir(): Promise<void> {
  await mkdir(PROJECTS_DIR, { ...BASE, recursive: true });
}

export async function saveProject(
  meta: ProjectMeta,
  lineAlg: LineAlg,
  shapes: Shape[]
): Promise<ProjectData> {
  await ensureDir();

  const data: ProjectData = {
    ...meta,
    updatedAt: new Date().toISOString(),
    lineAlg,
    shapes: shapes.map((s) => s.toJSON()),
  };

  await writeTextFile(projectFile(data.id), JSON.stringify(data, null, 2), BASE);
  await updateIndex(data);

  return data;
}

export async function loadProject(id: string): Promise<ProjectData | null> {
  const path = projectFile(id);
  if (!(await exists(path, BASE))) {
    return null;
  }

  try {
    const text = await readTextFile(path, BASE);
    return JSON.parse(text) as ProjectData;
  } catch {
    return null;
  }
}

export function projectShapes(data: ProjectData): Shape[] {
  const result: Shape[] = [];
  for (const raw of data.shapes ?? []) {
    const shape = shapeFromJSON(raw);
    if (shape) {
      result.push(shape);
    }
  }
  return result;
}

export async function loadProjectIndex(): Promise<ProjectMeta[]> {
  await ensureDir();

  if (!(await exists(INDEX_FILE, BASE))) {
    return [];
  }

  try {
    const text = await readTextFile(INDEX_FILE, BASE);
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as ProjectMeta[]) : [];
  } catch {
    return [];
  }
}

async function updateIndex(data: ProjectData): Promise<void> {
  const index = await loadProjectIndex();
  const meta: ProjectMeta = {
    id: data.id,
    name: data.name,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };

  const existing = index.findIndex((p) => p.id === data.id);
  if (existing >= 0) {
    index[existing] = meta;
  } else {
    index.push(meta);
  }

  await writeTextFile(INDEX_FILE, JSON.stringify(index, null, 2), BASE);
}
