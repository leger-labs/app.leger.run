/**
 * Data Format Transformers
 * 
 * Utilities to convert between RJSF nested data format and flat ConfigData format
 * Part of Task 018: Form Component Integration
 */

import type { ConfigData } from '@/types';

/**
 * Flatten RJSF nested data structure to ConfigData format
 * 
 * RJSF uses nested objects like:
 * {
 *   general: {
 *     app_settings: {
 *       WEBUI_URL: "http://localhost:3000",
 *       ENABLE_SIGNUP: true
 *     }
 *   }
 * }
 * 
 * ConfigData expects flat structure with all values as strings:
 * {
 *   WEBUI_URL: "http://localhost:3000",
 *   ENABLE_SIGNUP: "true"
 * }
 */
export function rjsfToConfigData(rjsfData: any): ConfigData {
  const configData: ConfigData = {};
  
  function flattenObject(obj: any, prefix = '') {
    if (obj === null || obj === undefined) {
      return;
    }
    
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      // Check if this is a field-level object (has env var names as keys)
      const keys = Object.keys(obj);
      const hasEnvVarKeys = keys.some(key => 
        key.toUpperCase() === key && key.includes('_')
      );
      
      if (hasEnvVarKeys) {
        // This level contains actual environment variables
        Object.entries(obj).forEach(([key, value]) => {
          if (key.toUpperCase() === key && key.includes('_')) {
            // This is an environment variable
            configData[key] = convertValueToString(value);
          } else {
            // This might be a nested category, continue flattening
            flattenObject(value, prefix);
          }
        });
      } else {
        // This is a category level, continue recursing
        Object.entries(obj).forEach(([_key, value]) => {
          flattenObject(value, prefix);
        });
      }
    }
  }
  
  flattenObject(rjsfData);
  return configData;
}

/**
 * Convert flat ConfigData to RJSF nested structure
 * 
 * Takes ConfigData and organizes it according to the schema hierarchy
 */
export function configDataToRjsf(configData: ConfigData, schema: any): any {
  
  // Build the nested structure based on schema
  function buildNestedStructure(schemaObj: any, currentPath: string[] = []) {
    if (!schemaObj || !schemaObj.properties) {
      return {};
    }
    
    const result: any = {};
    
    Object.entries(schemaObj.properties).forEach(([key, propSchema]: [string, any]) => {
      if (propSchema.type === 'object' && propSchema.properties) {
        // This is a nested object, recurse
        const nestedResult = buildNestedStructure(propSchema, [...currentPath, key]);
        if (Object.keys(nestedResult).length > 0) {
          result[key] = nestedResult;
        }
      } else {
        // This is a field, check if we have data for it
        if (configData[key] !== undefined) {
          result[key] = convertStringToTypedValue(configData[key], propSchema);
        }
      }
    });
    
    return result;
  }
  
  return buildNestedStructure(schema);
}

/**
 * Convert typed values to strings (for ConfigData storage)
 */
function convertValueToString(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Convert string values to typed values (for RJSF)
 */
function convertStringToTypedValue(stringValue: string, schema: any): any {
  if (!stringValue && stringValue !== '0' && stringValue !== 'false') {
    return schema.default;
  }
  
  switch (schema.type) {
    case 'boolean':
      if (stringValue === 'true' || stringValue === '1') return true;
      if (stringValue === 'false' || stringValue === '0') return false;
      return Boolean(stringValue);
    
    case 'integer': {
      const intValue = parseInt(stringValue, 10);
      return isNaN(intValue) ? schema.default : intValue;
    }
    
    case 'number': {
      const numValue = parseFloat(stringValue);
      return isNaN(numValue) ? schema.default : numValue;
    }
    
    case 'array':
      try {
        const parsed = JSON.parse(stringValue);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    
    case 'object':
      try {
        return JSON.parse(stringValue);
      } catch {
        return {};
      }
    
    default:
      return stringValue;
  }
}

/**
 * Extract field values from nested RJSF data for specific fields
 */
export function extractFieldValues(rjsfData: any, fieldNames: string[]): Record<string, any> {
  const values: Record<string, any> = {};
  const flatData = rjsfToConfigData(rjsfData);
  
  fieldNames.forEach(fieldName => {
    if (flatData[fieldName] !== undefined) {
      values[fieldName] = flatData[fieldName];
    }
  });
  
  return values;
}

/**
 * Merge configuration data while preserving types for RJSF
 */
export function mergeConfigData(
  existingRjsfData: any, 
  newConfigData: Partial<ConfigData>, 
  schema: any
): any {
  // Convert existing RJSF data to flat format
  const flatExisting = rjsfToConfigData(existingRjsfData);
  
  // Merge with new data
  const mergedFlat = { ...flatExisting, ...newConfigData };
  
  // Convert back to RJSF format
  return configDataToRjsf(mergedFlat, schema);
}

/**
 * Validate that RJSF data maintains compatibility with existing systems
 */
export function validateDataCompatibility(rjsfData: any, originalConfigData: ConfigData): boolean {
  try {
    const converted = rjsfToConfigData(rjsfData);
    
    // Check that all original fields are preserved
    const originalKeys = Object.keys(originalConfigData);
    
    // Allow for new fields, but ensure no original fields are lost
    const missingFields = originalKeys.filter(key => !(key in converted));
    
    if (missingFields.length > 0) {
      console.warn('Data compatibility issue - missing fields:', missingFields);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Data compatibility validation failed:', error);
    return false;
  }
}