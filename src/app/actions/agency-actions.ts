'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { Company, AgencySettings, AppUser } from '@/types/saas';

/**
 * Verify ID token and return decoded token
 */
async function verifyIdToken(idToken: string) {
  if (!adminAuth) return null;
  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Enable or disable agency mode for a company
 */
export async function enableAgencyMode(
  idToken: string,
  companyId: string,
  enable: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return { success: false, error: 'Invalid authentication' };
    }

    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    // Verify user has permission (must be admin of the company)
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data() as AppUser | undefined;
    
    if (!userData || (userData.companyId !== companyId && userData.role !== 'superadmin')) {
      return { success: false, error: 'Permission denied' };
    }

    if (enable) {
      // Enable agency mode
      const agencySettings: AgencySettings = {
        enabled: true,
        maxClients: 50, // Default limit
        clientCompanyIds: [],
        canCreateClients: true,
        canDeleteClients: true,
        canAccessClientBilling: true,
        canAccessClientApiKeys: true,
        applyWhiteLabelToClients: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await adminDb.collection('companies').doc(companyId).update({
        isAgency: true,
        agencySettings,
      });

      // Update the user to be an agency user
      await adminDb.collection('users').doc(decodedToken.uid).update({
        isAgencyUser: true,
        agencyCompanyIds: [],
      });
    } else {
      // Disable agency mode
      await adminDb.collection('companies').doc(companyId).update({
        isAgency: false,
        'agencySettings.enabled': false,
        'agencySettings.updatedAt': new Date().toISOString(),
      });

      // Remove agency user flag
      await adminDb.collection('users').doc(decodedToken.uid).update({
        isAgencyUser: false,
        agencyCompanyIds: [],
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error enabling agency mode:', error);
    return { success: false, error: 'Failed to update agency mode' };
  }
}

/**
 * Add an existing company as a client to the agency
 */
export async function addClientCompany(
  idToken: string,
  agencyCompanyId: string,
  clientCompanyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return { success: false, error: 'Invalid authentication' };
    }

    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    // Verify agency company exists and is an agency
    const agencyDoc = await adminDb.collection('companies').doc(agencyCompanyId).get();
    if (!agencyDoc.exists) {
      return { success: false, error: 'Agency company not found' };
    }
    
    const agencyData = agencyDoc.data() as Company;
    if (!agencyData.isAgency || !agencyData.agencySettings?.enabled) {
      return { success: false, error: 'Agency mode is not enabled' };
    }

    // Verify client company exists
    const clientDoc = await adminDb.collection('companies').doc(clientCompanyId).get();
    if (!clientDoc.exists) {
      return { success: false, error: 'Client company not found' };
    }

    // Check if already a client
    if (agencyData.agencySettings.clientCompanyIds?.includes(clientCompanyId)) {
      return { success: false, error: 'Company is already a client' };
    }

    // Check max clients limit
    const currentClients = agencyData.agencySettings.clientCompanyIds?.length || 0;
    if (currentClients >= agencyData.agencySettings.maxClients) {
      return { success: false, error: `Maximum client limit (${agencyData.agencySettings.maxClients}) reached` };
    }

    // Add client to agency
    const updatedClientIds = [...(agencyData.agencySettings.clientCompanyIds || []), clientCompanyId];
    
    await adminDb.collection('companies').doc(agencyCompanyId).update({
      'agencySettings.clientCompanyIds': updatedClientIds,
      'agencySettings.updatedAt': new Date().toISOString(),
    });

    // Mark client company as managed by agency
    await adminDb.collection('companies').doc(clientCompanyId).update({
      parentAgencyId: agencyCompanyId,
      managedByAgency: true,
    });

    // Update agency user's accessible companies
    await adminDb.collection('users').doc(decodedToken.uid).update({
      agencyCompanyIds: updatedClientIds,
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding client company:', error);
    return { success: false, error: 'Failed to add client company' };
  }
}

/**
 * Remove a client company from the agency
 */
export async function removeClientCompany(
  idToken: string,
  agencyCompanyId: string,
  clientCompanyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return { success: false, error: 'Invalid authentication' };
    }

    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    // Verify agency company exists
    const agencyDoc = await adminDb.collection('companies').doc(agencyCompanyId).get();
    if (!agencyDoc.exists) {
      return { success: false, error: 'Agency company not found' };
    }
    
    const agencyData = agencyDoc.data() as Company;

    // Remove client from agency
    const updatedClientIds = (agencyData.agencySettings?.clientCompanyIds || [])
      .filter(id => id !== clientCompanyId);
    
    await adminDb.collection('companies').doc(agencyCompanyId).update({
      'agencySettings.clientCompanyIds': updatedClientIds,
      'agencySettings.updatedAt': new Date().toISOString(),
    });

    // Remove agency reference from client company
    await adminDb.collection('companies').doc(clientCompanyId).update({
      parentAgencyId: null,
      managedByAgency: false,
    });

    // Update agency user's accessible companies
    await adminDb.collection('users').doc(decodedToken.uid).update({
      agencyCompanyIds: updatedClientIds,
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing client company:', error);
    return { success: false, error: 'Failed to remove client company' };
  }
}

/**
 * Create a new client company for the agency
 */
export async function createClientCompany(
  idToken: string,
  agencyCompanyId: string,
  clientData: {
    name: string;
    adminEmail: string;
  }
): Promise<{ success: boolean; error?: string; companyId?: string }> {
  try {
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return { success: false, error: 'Invalid authentication' };
    }

    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    // Verify agency company exists and is an agency
    const agencyDoc = await adminDb.collection('companies').doc(agencyCompanyId).get();
    if (!agencyDoc.exists) {
      return { success: false, error: 'Agency company not found' };
    }
    
    const agencyCompany = agencyDoc.data() as Company;
    if (!agencyCompany.isAgency || !agencyCompany.agencySettings?.enabled) {
      return { success: false, error: 'Agency mode is not enabled' };
    }

    // Check max clients limit
    const currentClients = agencyCompany.agencySettings.clientCompanyIds?.length || 0;
    if (currentClients >= agencyCompany.agencySettings.maxClients) {
      return { success: false, error: `Maximum client limit (${agencyCompany.agencySettings.maxClients}) reached` };
    }

    // Create new company
    const newCompanyRef = adminDb.collection('companies').doc();
    const newCompany: Partial<Company> = {
      id: newCompanyRef.id,
      name: clientData.name,
      adminEmail: clientData.adminEmail,
      ownerId: decodedToken.uid, // Agency user is the owner initially
      planId: 'plan_starter', // Default plan
      billingCycle: 'monthly',
      planExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 day trial
      status: 'active',
      createdAt: new Date(),
      parentAgencyId: agencyCompanyId,
      managedByAgency: true,
    };

    await newCompanyRef.set(newCompany);

    // Add to agency's client list
    const updatedClientIds = [...(agencyCompany.agencySettings.clientCompanyIds || []), newCompanyRef.id];
    
    await adminDb.collection('companies').doc(agencyCompanyId).update({
      'agencySettings.clientCompanyIds': updatedClientIds,
      'agencySettings.updatedAt': new Date().toISOString(),
    });

    // Update agency user's accessible companies
    await adminDb.collection('users').doc(decodedToken.uid).update({
      agencyCompanyIds: updatedClientIds,
    });

    return { success: true, companyId: newCompanyRef.id };
  } catch (error) {
    console.error('Error creating client company:', error);
    return { success: false, error: 'Failed to create client company' };
  }
}

/**
 * Get all client companies for an agency
 */
export async function getAgencyClients(
  agencyCompanyId: string
): Promise<{ success: boolean; clients?: Company[]; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    // Get agency company
    const agencyDoc = await adminDb.collection('companies').doc(agencyCompanyId).get();
    if (!agencyDoc.exists) {
      return { success: false, error: 'Agency company not found' };
    }
    
    const agencyData = agencyDoc.data() as Company;
    const clientIds = agencyData.agencySettings?.clientCompanyIds || [];

    if (clientIds.length === 0) {
      return { success: true, clients: [] };
    }

    // Fetch all client companies
    const clients: Company[] = [];
    for (const clientId of clientIds) {
      const clientDoc = await adminDb.collection('companies').doc(clientId).get();
      if (clientDoc.exists) {
        clients.push({ id: clientDoc.id, ...clientDoc.data() } as Company);
      }
    }

    return { success: true, clients };
  } catch (error) {
    console.error('Error getting agency clients:', error);
    return { success: false, error: 'Failed to get clients' };
  }
}

/**
 * Grant agency access to a user (make them an agency user)
 */
export async function grantAgencyAccess(
  idToken: string,
  targetUserId: string,
  agencyCompanyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return { success: false, error: 'Invalid authentication' };
    }

    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    // Get agency company to get client list
    const agencyDoc = await adminDb.collection('companies').doc(agencyCompanyId).get();
    if (!agencyDoc.exists) {
      return { success: false, error: 'Agency company not found' };
    }
    
    const agencyData = agencyDoc.data() as Company;
    const clientIds = agencyData.agencySettings?.clientCompanyIds || [];

    // Update target user to be an agency user
    await adminDb.collection('users').doc(targetUserId).update({
      isAgencyUser: true,
      agencyCompanyIds: clientIds,
    });

    return { success: true };
  } catch (error) {
    console.error('Error granting agency access:', error);
    return { success: false, error: 'Failed to grant agency access' };
  }
}
