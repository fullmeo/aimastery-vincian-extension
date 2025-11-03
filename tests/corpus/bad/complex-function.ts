/**
 * Complex function with poor movement score
 * - High complexity (CC=15+)
 * - Deep nesting (6+ levels)
 * - Poor flow
 */

function processOrder(order: any) {
  if (order) {
    if (order.items) {
      if (order.items.length > 0) {
        for (let i = 0; i < order.items.length; i++) {
          if (order.items[i].type === 'physical') {
            if (order.items[i].stock > 0) {
              if (order.items[i].price > 0) {
                // Process physical item
                console.log('Processing physical item');
              } else {
                console.log('Invalid price');
              }
            } else {
              console.log('Out of stock');
            }
          } else if (order.items[i].type === 'digital') {
            if (order.items[i].downloadLink) {
              if (order.items[i].price > 0) {
                console.log('Processing digital item');
              }
            }
          }
        }
      }
    }
  }
}
