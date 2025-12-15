// Memory Helpers - Atomic operations without race conditions
// Each memory item is stored separately to avoid read-modify-write races

// ============================================================================
// INTERNAL GENERIC HELPERS
// ============================================================================

/**
 * Generic upsert (update or create) - INTERNAL USE ONLY
 * @private
 */
async function _upsertItem(itemType, itemId, body) {
    try {
        await openkbs.updateItem({ itemType, itemId, body });
    } catch (e) {
        await openkbs.createItem({ itemType, itemId, body });
    }
    return { success: true, itemId };
}

/**
 * Generic delete - INTERNAL USE ONLY
 * @private
 */
async function _deleteItem(itemType, itemId) {
    try {
        await openkbs.deleteItem(itemId);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// ============================================================================
// PUBLIC MEMORY FUNCTIONS
// ============================================================================

/**
 * Set a memory value atomically
 * @param {string} itemId - The full itemId (e.g., "memory_business_profile")
 * @param {*} value - The value to store
 * @param {number} expirationInMinutes - Optional expiration time
 */
export async function setMemoryValue(itemId, value, expirationInMinutes = null) {
    if (!itemId.startsWith('memory_')) {
        throw new Error(`Invalid memory itemId: "${itemId}". Must start with "memory_"`);
    }

    const body = {
        value,
        updatedAt: new Date().toISOString()
    };

    if (expirationInMinutes != null) {
        body.exp = new Date(Date.now() + expirationInMinutes * 60 * 1000).toISOString();
    }

    return _upsertItem('memory', itemId, body);
}

/**
 * Delete any item by itemId
 * @param {string} itemId - The full itemId
 * @returns {Object} - { success: boolean, error?: string }
 */
export async function deleteItem(itemId) {
    try {
        await openkbs.deleteItem(itemId);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}