import { Injectable } from '@angular/core';

export interface WireOption {
  id: string;
  brand: string;
  specification?: string;
  ratePerKg: number;
}

export interface FencingConfiguration {
  poleSpacingFt: number;
  poleRate: number;
  supportPillarsRequired: boolean;
  supportPillarCount: number;
  installationRequired: boolean;
  wireRounds: number;
  wireBrand?: string;
  wireRatePerKg: number;
  installationRatePerPillar?: number;
}

export interface FencingCalculationResult {
  perimeterFeet: number;
  basePillars: number;
  supportPillars: number;
  totalPillars: number;
  poleCost: number;
  wireRounds: number;
  wireWeightKg: number;
  wireRatePerKg: number;
  wireCost: number;
  installationCost: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class FencingCalculatorService {
  readonly defaultWireRounds = 3;
  readonly referenceRounds = 3;
  readonly referenceKgPerSegment = 1;
  readonly installationRatePerPillar = 110;

  validateSupportPillars(supportPillarsRequired: boolean, supportPillarCount: number): {
    valid: boolean;
    message?: string;
  } {
    if (!supportPillarsRequired) {
      return { valid: true };
    }

    const count = Number(supportPillarCount);
    if (!Number.isFinite(count) || !Number.isInteger(count) || count <= 0) {
      return {
        valid: false,
        message: 'Enter the number of support pillars.'
      };
    }

    return { valid: true };
  }

  calculateBasePillars(perimeterFeet: number, poleSpacingFt: number): number {
    return Math.ceil(perimeterFeet / poleSpacingFt);
  }

  calculateRectangularPerimeter(areaSquareFeet: number, widthFeet: number): number {
    const lengthFeet = areaSquareFeet / widthFeet;
    return 2 * (widthFeet + lengthFeet);
  }

  calculateSupportPillars(supportPillarsRequired: boolean, supportPillarCount: number): number {
    if (!supportPillarsRequired) {
      return 0;
    }

    const count = Number(supportPillarCount);
    if (!Number.isFinite(count) || !Number.isInteger(count) || count <= 0) {
      return 0;
    }

    return count;
  }

  calculateTotalPillars(basePillars: number, supportPillars: number): number {
    return basePillars + supportPillars;
  }

  calculatePoleCost(totalPillars: number, poleRate: number): number {
    return totalPillars * poleRate;
  }

  calculateWireWeight(perimeterFeet: number, poleSpacingFt: number, wireRounds: number): number {
    const segments = Math.ceil(perimeterFeet / poleSpacingFt);
    const weightKg =
      segments * this.referenceKgPerSegment * (wireRounds / this.referenceRounds);

    return Number(weightKg.toFixed(2));
  }

  calculateWireCost(wireWeightKg: number, wireRatePerKg: number): number {
    return Math.round(wireWeightKg * wireRatePerKg);
  }

  calculateInstallation(
    totalPillars: number,
    installationRequired: boolean,
    ratePerPillar = this.installationRatePerPillar
  ): number {
    return installationRequired ? totalPillars * ratePerPillar : 0;
  }

  calculate(
    config: FencingConfiguration,
    perimeterFeet: number
  ): FencingCalculationResult {
    const basePillars = this.calculateBasePillars(perimeterFeet, config.poleSpacingFt);
    const supportPillars = this.calculateSupportPillars(
      config.supportPillarsRequired,
      config.supportPillarCount
    );
    const totalPillars = this.calculateTotalPillars(basePillars, supportPillars);
    const poleCost = this.calculatePoleCost(totalPillars, config.poleRate);
    const wireRounds = Number(config.wireRounds) || this.defaultWireRounds;
    const wireWeightKg = this.calculateWireWeight(perimeterFeet, config.poleSpacingFt, wireRounds);
    const wireCost = this.calculateWireCost(wireWeightKg, config.wireRatePerKg);
    const installationCost = this.calculateInstallation(
      totalPillars,
      config.installationRequired,
      config.installationRatePerPillar
    );

    return {
      perimeterFeet: Math.round(perimeterFeet),
      basePillars,
      supportPillars,
      totalPillars,
      poleCost,
      wireRounds,
      wireWeightKg,
      wireRatePerKg: config.wireRatePerKg,
      wireCost,
      installationCost,
      total: poleCost + wireCost + installationCost
    };
  }
}
