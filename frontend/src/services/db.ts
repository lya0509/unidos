import Dexie, { type Table } from 'dexie';

export interface InventoryItem {
  insumo: string;
  cantidad: number;
}

export interface SyncAction {
  id?: number;
  type: 'CONSUME' | 'ADD_MANUAL' | 'CREATE_CHECKLIST' | 'CREATE_SOS';
  payload: any;
  timestamp: number;
}

export class UnidosDatabase extends Dexie {
  inventory!: Table<InventoryItem, string>;
  syncQueue!: Table<SyncAction, number>;

  constructor() {
    super('Unidos_DB');
    this.version(1).stores({
      inventory: 'insumo', // Primary key is 'insumo'
      syncQueue: '++id, type, timestamp' // Auto-increment ID
    });
  }
}

export const db = new UnidosDatabase();
