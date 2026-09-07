import type { ShippingProvider, ShipmentInput } from './types';

/** ShipPrime adapter is intentionally endpoint-agnostic until the merchant's official API contract is configured. */
export const shipprime: ShippingProvider = {
  key: 'shipprime',
  async testConnection() {
    return Boolean(process.env.SHIPPRIME_BASE_URL && process.env.SHIPPRIME_API_KEY);
  },
  async checkPincode() {
    throw new Error('SHIPPRIME_API_CONTRACT_NOT_CONFIGURED');
  },
  async getServiceability() {
    throw new Error('SHIPPRIME_API_CONTRACT_NOT_CONFIGURED');
  },
  async createShipment(_i: ShipmentInput) {
    throw new Error('SHIPPRIME_API_CONTRACT_NOT_CONFIGURED');
  },
  async assignAwb() {
    throw new Error('SHIPPRIME_API_CONTRACT_NOT_CONFIGURED');
  },
  async requestPickup() {
    throw new Error('SHIPPRIME_API_CONTRACT_NOT_CONFIGURED');
  },
  async generateLabel() {
    throw new Error('SHIPPRIME_API_CONTRACT_NOT_CONFIGURED');
  },
  async track() {
    throw new Error('SHIPPRIME_API_CONTRACT_NOT_CONFIGURED');
  },
  async cancelShipment() {
    throw new Error('SHIPPRIME_API_CONTRACT_NOT_CONFIGURED');
  },
};
