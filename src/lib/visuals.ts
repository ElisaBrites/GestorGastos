import type { Category, Subcategory } from '../types'

/**
 * Las subcategorías antiguas no tienen icono ni color propios. En ese caso
 * usamos los de su categoría para que siempre se muestre una identidad visual.
 */
export function subcategoryVisual(
  subcategory?: Pick<Subcategory, 'icon' | 'color'> | null,
  category?: Pick<Category, 'icon' | 'color'> | null,
) {
  return {
    icon: subcategory?.icon ?? category?.icon ?? 'Tag',
    color: subcategory?.color ?? category?.color ?? '#64748b',
  }
}
