// ==========================================
// JARVIS — SMS Composer Service
// Uses expo-sms to send texts through the device's native SMS app
// ==========================================

import * as SMS from 'expo-sms';
import * as Contacts from 'expo-contacts';
import { Alert, Platform } from 'react-native';

export interface SMSRequest {
  recipientName: string;
  messageBody: string;
  phoneNumber?: string; // If already resolved
}

/**
 * Look up a contact by name from the device's contact book
 */
export async function findContactByName(name: string): Promise<{
  found: boolean;
  phoneNumber?: string;
  contactName?: string;
}> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      return { found: false };
    }

    // Search for the contact by name
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      name: name,
    });

    if (data.length === 0) {
      return { found: false };
    }

    // Find the best match
    const contact = data[0];
    const phoneNumbers = contact.phoneNumbers;

    if (!phoneNumbers || phoneNumbers.length === 0) {
      return { found: true, contactName: contact.name };
    }

    // Prefer mobile number, fallback to first available
    const mobile = phoneNumbers.find(
      (p) => p.label?.toLowerCase() === 'mobile' || p.label?.toLowerCase() === 'cell'
    );
    const phoneNumber = mobile?.number || phoneNumbers[0].number;

    return {
      found: true,
      phoneNumber: phoneNumber || undefined,
      contactName: contact.name || undefined,
    };
  } catch (error) {
    console.error('Error finding contact:', error);
    return { found: false };
  }
}

/**
 * Send an SMS through the device's native SMS app.
 * Both iOS and Android will open the SMS composer for user confirmation.
 */
export async function sendSMS(request: SMSRequest): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Check if SMS is available on this device
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        message: 'SMS is not available on this device',
      };
    }

    let phoneNumber = request.phoneNumber;

    // If no phone number provided, try to look up the contact
    if (!phoneNumber) {
      const contact = await findContactByName(request.recipientName);

      if (!contact.found) {
        return {
          success: false,
          message: `Contact "${request.recipientName}" not found. Please check your device contacts.`,
        };
      }

      if (!contact.phoneNumber) {
        return {
          success: false,
          message: `Contact "${request.recipientName}" has no phone number.`,
        };
      }

      phoneNumber = contact.phoneNumber;
    }

    // Open the native SMS composer
    // iOS: MFMessageComposeViewController
    // Android: SMS Intent
    const { result } = await SMS.sendSMSAsync(
      [phoneNumber],
      request.messageBody
    );

    // Result values:
    // 'sent' — user sent the message (iOS only, Android always returns 'unknown')
    // 'cancelled' — user cancelled
    // 'unknown' — status unknown (Android default)
    if (result === 'cancelled') {
      return {
        success: false,
        message: 'Message cancelled by user',
      };
    }

    return {
      success: true,
      message: Platform.OS === 'ios'
        ? result === 'sent'
          ? `Message sent to ${request.recipientName}`
          : `Message compose opened for ${request.recipientName}`
        : `Message compose opened for ${request.recipientName}`,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      message: `Failed to send message: ${(error as Error).message}`,
    };
  }
}
