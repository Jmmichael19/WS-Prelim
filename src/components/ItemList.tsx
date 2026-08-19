import type { ReactNode } from "react";

/**
 * Generic over <T> so this one component can render a list of Pokemon,
 * or later a list of anything else, without losing type safety.
 * The caller supplies getKey/renderItem so ItemList never needs to know
 * the shape of T beyond "it has a key".
 */
interface ItemListProps<T> {
  items: T[];
  getKey: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
  emptyMessage?: string;
}

export function ItemList<T>({
  items,
  getKey,
  renderItem,
  emptyMessage = "No items found.",
}: ItemListProps<T>) {
  if (items.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="item-list">
      {items.map((item) => (
        <div className="item-list__item" key={getKey(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
