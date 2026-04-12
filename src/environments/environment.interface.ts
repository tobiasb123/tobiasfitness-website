export type EnvironmentType = 'production' | 'development' | 'developmentFunc';

export interface Environment {
  type: EnvironmentType;
}
