/**
 * Custom RJSF Templates
 * Export all custom templates for RJSF integration
 */

import { TemplatesType } from '@rjsf/utils';
import { FieldTemplate } from './FieldTemplate';
import { ObjectFieldTemplate } from './ObjectFieldTemplate';
import { ArrayFieldTemplate } from './ArrayFieldTemplate';

export const customTemplates: Partial<TemplatesType> = {
  FieldTemplate,
  ObjectFieldTemplate,
  ArrayFieldTemplate,
};

export { FieldTemplate, ObjectFieldTemplate, ArrayFieldTemplate };
