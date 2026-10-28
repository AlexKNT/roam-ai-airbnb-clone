export const savedStayScreens = {
  home: 'home',
  search: 'search',
  detail: 'detail',
  trips: 'trips',
} as const;

export type SavedStayScreen = (typeof savedStayScreens)[keyof typeof savedStayScreens];
