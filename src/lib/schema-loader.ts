import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import schemaJson from '@/generated/schema.json';
import uiSchemaJson from '@/generated/uiSchema.json';
import categoriesJson from '@/generated/categories.json';
import type {
  ReleaseCategory,
  ReleaseCategoryField,
} from '@/types/release-schema';

export interface ReleaseSchemaBundle {
  schema: RJSFSchema;
  uiSchema: UiSchema;
  categories: ReleaseCategory[];
}

const EMPTY_SCHEMA: RJSFSchema = { type: 'object', properties: {} };

function normalizeFields(rawFields: unknown): ReleaseCategoryField[] {
  if (!Array.isArray(rawFields)) {
    return [];
  }

  return rawFields
    .map((field): ReleaseCategoryField | null => {
      if (typeof field !== 'object' || field === null) {
        return null;
      }

      const path = typeof (field as any).path === 'string' ? (field as any).path : '';
      if (!path) {
        return null;
      }

      const name = typeof (field as any).name === 'string' ? (field as any).name : path;
      const title =
        typeof (field as any).title === 'string'
          ? (field as any).title
          : name;

      return {
        path,
        name,
        title,
        type: typeof (field as any).type === 'string' ? (field as any).type : undefined,
        required:
          typeof (field as any).required === 'boolean'
            ? (field as any).required
            : undefined,
        order:
          typeof (field as any).order === 'number'
            ? (field as any).order
            : undefined,
      };
    })
    .filter((field): field is ReleaseCategoryField => field !== null)
    .sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.title.localeCompare(b.title);
    });
}

function normalizeCategories(rawCategories: unknown): ReleaseCategory[] {
  if (!Array.isArray(rawCategories)) {
    return [];
  }

  return rawCategories
    .map((category): ReleaseCategory | null => {
      if (typeof category !== 'object' || category === null) {
        return null;
      }

      const name =
        typeof (category as any).name === 'string'
          ? (category as any).name
          : 'General';

      const order =
        typeof (category as any).order === 'number'
          ? (category as any).order
          : undefined;

      const fields = normalizeFields((category as any).fields);

      return { name, order, fields };
    })
    .filter((category): category is ReleaseCategory => category !== null)
    .sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });
}

let cachedBundle: ReleaseSchemaBundle | null = null;

export function getReleaseSchemaBundle(): ReleaseSchemaBundle {
  if (cachedBundle) {
    return cachedBundle;
  }

  try {
    const schema = (schemaJson as RJSFSchema) || EMPTY_SCHEMA;
    const uiSchema = (uiSchemaJson as UiSchema) || {};
    const categories = normalizeCategories(categoriesJson);

    cachedBundle = {
      schema,
      uiSchema,
      categories,
    };
  } catch (error) {
    console.warn('Failed to load generated release schema bundle', error);
    cachedBundle = {
      schema: EMPTY_SCHEMA,
      uiSchema: {},
      categories: [],
    };
  }

  return cachedBundle;
}

