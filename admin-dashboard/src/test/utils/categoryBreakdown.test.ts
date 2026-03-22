import { describe, expect, it } from 'vitest';

import { mergeCategoryBreakdown, topCategoriesWithOther } from '../../utils/categoryBreakdown';

describe('mergeCategoryBreakdown', () => {
  it('merges Other and Others into one bucket', () => {
    const out = mergeCategoryBreakdown([
      { label: 'Sales', value: 10 },
      { label: 'Other', value: 5 },
      { label: 'Others', value: 3 },
    ]);
    const other = out.find((x) => x.label === 'Other');
    expect(other?.value).toBe(8);
    expect(out.some((x) => x.label === 'Others')).toBe(false);
  });

  it('sorts by value descending', () => {
    const out = mergeCategoryBreakdown([
      { label: 'A', value: 1 },
      { label: 'B', value: 99 },
    ]);
    expect(out[0].label).toBe('B');
  });
});

describe('topCategoriesWithOther', () => {
  it('keeps top 3 plus merged tail', () => {
    const out = topCategoriesWithOther(
      [
        { label: 'A', value: 100 },
        { label: 'B', value: 50 },
        { label: 'C', value: 25 },
        { label: 'D', value: 10 },
        { label: 'E', value: 5 },
      ],
      4
    );
    expect(out).toHaveLength(4);
    expect(out[3].label).toBe('Smaller categories');
    expect(out[3].value).toBe(15);
  });

  it('does not duplicate "Other" when an explicit Other is in the top slice', () => {
    const out = topCategoriesWithOther(
      [
        { label: 'Sales', value: 1124 },
        { label: 'Other', value: 1113 },
        { label: 'School fees', value: 80 },
        { label: 'Transport', value: 3 },
        { label: 'Gifts', value: 2 },
      ],
      4
    );
    expect(out.map((x) => x.label)).toEqual(['Sales', 'Other', 'School fees', 'Smaller categories']);
    expect(out.filter((x) => x.label === 'Other')).toHaveLength(1);
    expect(out.find((x) => x.label === 'Smaller categories')?.value).toBe(5);
  });
});
