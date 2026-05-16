// ==========================================
// JARVIS — Contacts Hook
// Accesses device contacts via expo-contacts
// ==========================================

import { useState, useCallback } from 'react';
import * as Contacts from 'expo-contacts';
import { Contact } from '../types';

interface UseContactsReturn {
  contacts: Contact[];
  loading: boolean;
  hasPermission: boolean | null;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  loadContacts: () => Promise<void>;
  findContact: (name: string) => Promise<Contact | null>;
}

export function useContacts(): UseContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (err) {
      console.error('Error requesting contacts permission:', err);
      setError((err as Error).message);
      return false;
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const permission = await requestPermission();
      if (!permission) {
        setError('Contacts permission not granted');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        sort: Contacts.SortTypes.FirstName,
      });

      const mapped: Contact[] = data
        .filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
        .map((c) => ({
          id: c.id!,
          name: c.name!,
          phoneNumbers: c.phoneNumbers?.map((p) => ({
            number: p.number || '',
            label: p.label || 'other',
          })),
        }));

      setContacts(mapped);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [requestPermission]);

  const findContact = useCallback(
    async (name: string): Promise<Contact | null> => {
      try {
        const permission = await requestPermission();
        if (!permission) return null;

        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
          name,
        });

        if (data.length === 0) return null;

        const c = data[0];
        return {
          id: c.id!,
          name: c.name!,
          phoneNumbers: c.phoneNumbers?.map((p) => ({
            number: p.number || '',
            label: p.label || 'other',
          })),
        };
      } catch (err) {
        console.error('Error finding contact:', err);
        return null;
      }
    },
    [requestPermission]
  );

  return {
    contacts,
    loading,
    hasPermission,
    error,
    requestPermission,
    loadContacts,
    findContact,
  };
}
