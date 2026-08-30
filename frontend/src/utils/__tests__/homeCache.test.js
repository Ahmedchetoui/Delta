import { HOME_CACHE_KEY, readHomeCache, writeHomeCache } from '../homeCache';

const homeData = {
  banners: [],
  categories: [],
  featuredProducts: [],
  newProducts: [],
};

describe('homeCache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('restores valid home data', () => {
    writeHomeCache(homeData);

    expect(readHomeCache()).toEqual(homeData);
  });

  test('drops expired home data', () => {
    localStorage.setItem(HOME_CACHE_KEY, JSON.stringify({
      savedAt: Date.now() - (25 * 60 * 60 * 1000),
      data: homeData,
    }));

    expect(readHomeCache()).toBeNull();
    expect(localStorage.getItem(HOME_CACHE_KEY)).toBeNull();
  });
});
