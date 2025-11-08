/**
 * User Settings Routes
 * Handles user preferences and configuration
 */

import { authenticateRequest, successResponse, errorResponse } from '../middleware/auth';
import type { Env } from '../index';

export interface UserSettings {
  tailscale?: {
    full_hostname: string;
    hostname: string;
    tailnet: string;
  };
}

/**
 * GET /settings
 * Get user settings
 */
export async function handleGetSettings(request: Request, env: Env): Promise<Response> {
  const user = await authenticateRequest(request, env);

  try {
    // Query the database for user settings
    const result = await env.LEGER_DB.prepare(
      'SELECT settings FROM user_settings WHERE user_uuid = ?'
    )
      .bind(user.user_uuid)
      .first<{ settings: string }>();

    if (!result) {
      // Return empty settings if not found
      return successResponse({
        settings: {},
      });
    }

    return successResponse({
      settings: JSON.parse(result.settings),
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    return errorResponse(
      'database_error',
      'Failed to retrieve user settings',
      500
    );
  }
}

/**
 * POST /settings
 * Update user settings (merge with existing)
 */
export async function handleUpdateSettings(request: Request, env: Env): Promise<Response> {
  const user = await authenticateRequest(request, env);

  try {
    const body = await request.json() as { settings: UserSettings };

    if (!body.settings) {
      return errorResponse(
        'invalid_request',
        'Missing settings in request body',
        400
      );
    }

    // Validate Tailscale configuration if provided
    if (body.settings.tailscale) {
      const { full_hostname, hostname, tailnet } = body.settings.tailscale;

      if (!full_hostname) {
        return errorResponse(
          'invalid_request',
          'full_hostname is required in Tailscale configuration',
          400
        );
      }

      // Validate full_hostname pattern
      const pattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.tail[a-z0-9]+\.ts\.net$/;
      if (!pattern.test(full_hostname)) {
        return errorResponse(
          'invalid_request',
          'Invalid Tailscale MagicDNS hostname format',
          400
        );
      }

      // Validate hostname and tailnet match full_hostname
      const expectedHostname = full_hostname.split('.')[0];
      const expectedTailnet = full_hostname.substring(expectedHostname.length + 1);

      if (hostname !== expectedHostname || tailnet !== expectedTailnet) {
        return errorResponse(
          'invalid_request',
          'hostname and tailnet must match full_hostname',
          400
        );
      }
    }

    // Get existing settings
    const existing = await env.LEGER_DB.prepare(
      'SELECT settings FROM user_settings WHERE user_uuid = ?'
    )
      .bind(user.user_uuid)
      .first<{ settings: string }>();

    let mergedSettings: UserSettings;
    if (existing) {
      // Merge with existing settings
      const existingSettings = JSON.parse(existing.settings) as UserSettings;
      mergedSettings = {
        ...existingSettings,
        ...body.settings,
      };
    } else {
      mergedSettings = body.settings;
    }

    const now = new Date().toISOString();

    // Upsert settings
    await env.LEGER_DB.prepare(
      `INSERT INTO user_settings (user_uuid, settings, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_uuid) DO UPDATE SET
         settings = excluded.settings,
         updated_at = excluded.updated_at`
    )
      .bind(
        user.user_uuid,
        JSON.stringify(mergedSettings),
        now,
        now
      )
      .run();

    return successResponse({
      settings: mergedSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return errorResponse(
      'database_error',
      'Failed to update user settings',
      500
    );
  }
}
