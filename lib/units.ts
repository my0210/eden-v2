import { MetricUnitType, UnitPreferences, UnitSystem } from '@/lib/types';
import { MetricValueType } from '@/lib/types';

export type UnitOption = {
  label: string;
  value: string;
};

export function getUnitOptions(unitType?: MetricUnitType): UnitOption[] {
  switch (unitType) {
    case 'mass':
      return [
        { label: 'kg', value: 'kg' },
        { label: 'lb', value: 'lb' },
      ];
    case 'length':
      return [
        { label: 'cm', value: 'cm' },
        { label: 'in', value: 'in' },
      ];
    case 'temperature':
      return [
        { label: 'C', value: 'C' },
        { label: 'F', value: 'F' },
      ];
    case 'duration':
      return [
        { label: 'min', value: 'min' },
        { label: 'hr', value: 'hr' },
      ];
    case 'glucose':
      return [
        { label: 'mg/dL', value: 'mg/dL' },
        { label: 'mmol/L', value: 'mmol/L' },
      ];
    case 'lipids_cholesterol':
    case 'lipids_triglycerides':
    case 'lipids':
      return [
        { label: 'mg/dL', value: 'mg/dL' },
        { label: 'mmol/L', value: 'mmol/L' },
      ];
    default:
      return [];
  }
}

export function inferUnitType(unit?: string, valueType?: MetricValueType): MetricUnitType | undefined {
  if (!unit) {
    if (valueType === 'duration') return 'duration';
    return undefined;
  }
  const normalized = unit.toLowerCase();
  if (normalized.includes('kg') || normalized.includes('lb')) return 'mass';
  if (normalized.includes('cm') || normalized.includes('inch') || normalized === 'in') return 'length';
  if (normalized.includes('°c') || normalized === 'c' || normalized === 'celsius') return 'temperature';
  if (normalized.includes('°f') || normalized === 'f' || normalized === 'fahrenheit') return 'temperature';
  if (normalized.includes('mg/dl')) return 'glucose';
  if (normalized.includes('mmhg')) return 'pressure';
  if (normalized.includes('bpm') || normalized.includes('breaths/min')) return 'rate';
  if (normalized.includes('min') || normalized.includes('hour') || normalized.includes('sec')) return 'duration';
  if (normalized.includes('%')) return 'percentage';
  if (normalized.includes('score')) return 'score';
  if (normalized.includes('count') || normalized.includes('reps')) return 'count';
  if (normalized.includes('ratio')) return 'ratio';
  return 'unitless';
}

export function getCanonicalUnit(unit?: string, unitType?: MetricUnitType): string | undefined {
  if (unitType === 'mass') return 'kg';
  if (unitType === 'length') return 'cm';
  if (unitType === 'temperature') return 'C';
  if (unitType === 'duration') return 'min';
  return unit;
}

export function getDefaultInputUnit(
  unitType?: MetricUnitType,
  unitSystem: UnitSystem = 'metric',
  unitPreferences?: UnitPreferences
): string | undefined {
  if (!unitType) return undefined;
  if (unitType === 'mass') return unitSystem === 'imperial' ? 'lb' : 'kg';
  if (unitType === 'length') return unitSystem === 'imperial' ? 'in' : 'cm';
  if (unitType === 'temperature') return unitSystem === 'imperial' ? 'F' : 'C';
  if (unitType === 'duration') return 'min';
  if (unitType === 'glucose') return unitPreferences?.glucoseUnit || 'mg/dL';
  if (unitType === 'lipids_cholesterol' || unitType === 'lipids_triglycerides' || unitType === 'lipids') {
    return unitPreferences?.lipidsUnit || 'mg/dL';
  }
  return undefined;
}

export function toCanonicalValue(value: number, unitType?: MetricUnitType, inputUnit?: string): number {
  if (!unitType || !inputUnit) return value;
  switch (unitType) {
    case 'mass':
      return inputUnit === 'lb' ? value * 0.45359237 : value;
    case 'length':
      return inputUnit === 'in' ? value * 2.54 : value;
    case 'temperature':
      return inputUnit === 'F' ? (value - 32) * (5 / 9) : value;
    case 'duration':
      return inputUnit === 'hr' ? value * 60 : value;
    case 'glucose':
      return inputUnit === 'mmol/L' ? value * 18 : value;
    case 'lipids_cholesterol':
      return inputUnit === 'mmol/L' ? value * 38.67 : value;
    case 'lipids_triglycerides':
      return inputUnit === 'mmol/L' ? value * 88.57 : value;
    case 'lipids':
      return inputUnit === 'mmol/L' ? value * 38.67 : value;
    default:
      return value;
  }
}

export function fromCanonicalValue(value: number, unitType?: MetricUnitType, outputUnit?: string): number {
  if (!unitType || !outputUnit) return value;
  switch (unitType) {
    case 'mass':
      return outputUnit === 'lb' ? value / 0.45359237 : value;
    case 'length':
      return outputUnit === 'in' ? value / 2.54 : value;
    case 'temperature':
      return outputUnit === 'F' ? value * (9 / 5) + 32 : value;
    case 'duration':
      return outputUnit === 'hr' ? value / 60 : value;
    case 'glucose':
      return outputUnit === 'mmol/L' ? value / 18 : value;
    case 'lipids_cholesterol':
      return outputUnit === 'mmol/L' ? value / 38.67 : value;
    case 'lipids_triglycerides':
      return outputUnit === 'mmol/L' ? value / 88.57 : value;
    case 'lipids':
      return outputUnit === 'mmol/L' ? value / 38.67 : value;
    default:
      return value;
  }
}

export function convertValueBetweenUnits(
  value: number,
  unitType?: MetricUnitType,
  fromUnit?: string,
  toUnit?: string
): number {
  if (!unitType || !fromUnit || !toUnit || fromUnit === toUnit) return value;
  const canonical = toCanonicalValue(value, unitType, fromUnit);
  return fromCanonicalValue(canonical, unitType, toUnit);
}

export function toDisplayValue(
  value: number,
  unitType?: MetricUnitType,
  unitSystem: UnitSystem = 'metric',
  unitPreferences?: UnitPreferences
): { value: number; unit?: string } {
  if (!unitType) return { value };
  switch (unitType) {
    case 'mass':
      return unitSystem === 'imperial'
        ? { value: value / 0.45359237, unit: 'lb' }
        : { value, unit: 'kg' };
    case 'length':
      return unitSystem === 'imperial'
        ? { value: value / 2.54, unit: 'in' }
        : { value, unit: 'cm' };
    case 'temperature':
      return unitSystem === 'imperial'
        ? { value: value * (9 / 5) + 32, unit: 'F' }
        : { value, unit: 'C' };
    case 'duration':
      return { value, unit: 'min' };
    case 'glucose': {
      const unit = unitPreferences?.glucoseUnit || 'mg/dL';
      return { value: fromCanonicalValue(value, unitType, unit), unit };
    }
    case 'lipids_cholesterol':
    case 'lipids_triglycerides': {
      const unit = unitPreferences?.lipidsUnit || 'mg/dL';
      return { value: fromCanonicalValue(value, unitType, unit), unit };
    }
    case 'lipids': {
      const unit = unitPreferences?.lipidsUnit || 'mg/dL';
      return { value: fromCanonicalValue(value, unitType, unit), unit };
    }
    default:
      return { value };
  }
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes >= 90) {
    const hours = minutes / 60;
    return `${hours.toFixed(1)}h`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = Math.round(minutes % 60);
    return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
  }
  return `${Math.round(minutes)}m`;
}
