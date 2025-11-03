/**
 * Custom RJSF Widgets
 * Export all custom widgets for RJSF integration
 */

import { RegistryWidgetsType } from '@rjsf/utils';
import { TextWidget } from './TextWidget';
import { SelectWidget } from './SelectWidget';
import { CheckboxWidget } from './CheckboxWidget';
import { TextareaWidget } from './TextareaWidget';
import { NumberWidget } from './NumberWidget';
import { URLWidget } from './URLWidget';

export const customWidgets: RegistryWidgetsType = {
  TextWidget,
  SelectWidget,
  CheckboxWidget,
  TextareaWidget,
  NumberWidget,
  URLWidget,
  // Map common widget names to our custom widgets
  text: TextWidget,
  select: SelectWidget,
  checkbox: CheckboxWidget,
  textarea: TextareaWidget,
  number: NumberWidget,
  updown: NumberWidget,
  url: URLWidget,
  uri: URLWidget,
};

export {
  TextWidget,
  SelectWidget,
  CheckboxWidget,
  TextareaWidget,
  NumberWidget,
  URLWidget,
};
