/**
 * Unbalanced class
 * - Wildly varying method sizes
 * - Poor symmetry
 */

export class DataProcessor {
  // Tiny method (2 LOC)
  getId(): string {
    return 'id';
  }

  // Huge method (100+ LOC)
  processData(data: any): any {
    const result: any = {};
    if (data) {
      if (data.type === 'user') {
        result.userType = true;
        result.name = data.name || '';
        result.email = data.email || '';
        result.phone = data.phone || '';
        result.address = data.address || {};
        result.preferences = data.preferences || {};
        result.settings = data.settings || {};
        result.metadata = data.metadata || {};
        // ... 80 more lines of similar code
        for (let i = 0; i < 50; i++) {
          if (data.items && data.items[i]) {
            result.items = result.items || [];
            result.items.push({
              id: data.items[i].id,
              name: data.items[i].name,
              value: data.items[i].value,
            });
          }
        }
      } else if (data.type === 'order') {
        result.orderType = true;
        // ... another 40 lines
      }
    }
    return result;
  }

  // Medium method (15 LOC)
  validateData(data: any): boolean {
    if (!data) return false;
    if (!data.type) return false;
    if (!data.id) return false;
    return true;
  }

  // Tiny method (1 LOC)
  clear(): void {
    /* do nothing */
  }
}
