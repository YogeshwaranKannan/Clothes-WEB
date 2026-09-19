Example usage: dispatch updateOrAddItem

In a component (e.g., ProductDetailsComponent) inject Store and dispatch the action:

```ts
// inside your component
const cartItem: CartItem = {
  productId: product.id || product.productId,
  title: product.name,
  dealPrice: product.dealPrice,
  mrp: product.mrp,
  quantity: selectedQuantity,
  imageUrl: product.images?.[0] || product.imageUrl,
  item: product,
  options: { color: selectedColor, storage: selectedStorage }
};

this.store.dispatch(updateOrAddItem({ item: cartItem }));
```

Notes:
- `updateOrAddItem` will merge with an existing item only when both productId and options match.
- Otherwise it appends the new item to the cart array.
