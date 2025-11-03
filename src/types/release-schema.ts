export interface ReleaseCategoryField {
  path: string;
  name: string;
  title: string;
  type?: string;
  required?: boolean;
  order?: number;
}

export interface ReleaseCategory {
  name: string;
  order?: number;
  fields: ReleaseCategoryField[];
}

