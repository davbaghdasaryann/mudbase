import { randomUUID } from 'crypto';
import bs58 from 'bs58';

export function generateInvitationId() {
    const uuid = randomUUID().replace(/-/g, ''); // Remove dashes
    const buffer = Buffer.from(uuid, 'hex'); // Convert to bytes
    return bs58.encode(buffer); // Encode in Base58
}
