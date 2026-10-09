import { FencingCalculatorService } from './fencing-calculator.service';

describe('FencingCalculatorService', () => {
  let service: FencingCalculatorService;

  beforeEach(() => {
    service = new FencingCalculatorService();
  });

  it('calculates without support pillars', () => {
    const result = service.calculate(
      {
        poleSpacingFt: 10,
        poleRate: 450,
        supportPillarsRequired: false,
        supportPillarCount: 5,
        installationRequired: false,
        wireRounds: 3,
        wireBrand: 'standard',
        wireRatePerKg: 105
      },
      100
    );

    expect(result.basePillars).toBe(10);
    expect(result.supportPillars).toBe(0);
    expect(result.totalPillars).toBe(10);
    expect(result.poleCost).toBe(4500);
  });

  it('calculates a rectangular perimeter from area and front width', () => {
    expect(service.calculateRectangularPerimeter(1361.25, 8.25)).toBe(346.5);
    expect(service.calculateRectangularPerimeter(2722.5, 8.25)).toBe(676.5);
  });

  it('calculates with 3 support pillars', () => {
    const result = service.calculate(
      {
        poleSpacingFt: 10,
        poleRate: 450,
        supportPillarsRequired: true,
        supportPillarCount: 3,
        installationRequired: false,
        wireRounds: 3,
        wireBrand: 'standard',
        wireRatePerKg: 105
      },
      100
    );

    expect(result.basePillars).toBe(10);
    expect(result.supportPillars).toBe(3);
    expect(result.totalPillars).toBe(13);
    expect(result.poleCost).toBe(5850);
  });

  it('calculates with 5 support pillars', () => {
    const result = service.calculate(
      {
        poleSpacingFt: 10,
        poleRate: 450,
        supportPillarsRequired: true,
        supportPillarCount: 5,
        installationRequired: false,
        wireRounds: 3,
        wireBrand: 'standard',
        wireRatePerKg: 105
      },
      100
    );

    expect(result.totalPillars).toBe(15);
    expect(result.poleCost).toBe(6750);
  });

  it('ignores stale support count when unchecked', () => {
    const result = service.calculate(
      {
        poleSpacingFt: 10,
        poleRate: 450,
        supportPillarsRequired: false,
        supportPillarCount: 5,
        installationRequired: false,
        wireRounds: 3,
        wireBrand: 'standard',
        wireRatePerKg: 105
      },
      100
    );

    expect(result.supportPillars).toBe(0);
    expect(result.totalPillars).toBe(10);
  });

  it('calculates wire weight for different rounds', () => {
    expect(service.calculateWireWeight(100, 10, 3)).toBe(10);
    expect(service.calculateWireWeight(100, 10, 4)).toBe(13.33);
    expect(service.calculateWireWeight(100, 10, 5)).toBe(16.67);
    expect(service.calculateWireWeight(100, 10, 6)).toBe(20);
  });

  it('calculates wire cost from weight and rate', () => {
    expect(service.calculateWireCost(10, 105)).toBe(1050);
    expect(service.calculateWireCost(10, 120)).toBe(1200);
    expect(service.calculateWireCost(10, 150)).toBe(1500);
  });

  it('does not add installation cost when installation is not selected', () => {
    const result = service.calculate(
      {
        poleSpacingFt: 10,
        poleRate: 450,
        supportPillarsRequired: true,
        supportPillarCount: 3,
        installationRequired: false,
        wireRounds: 3,
        wireBrand: 'standard',
        wireRatePerKg: 105
      },
      100
    );

    expect(result.poleCost).toBe(5850);
    expect(result.wireCost).toBe(1050);
    expect(result.installationCost).toBe(0);
    expect(result.total).toBe(6900);
  });

  it('adds installation and handling at ₹110 for every total pillar when selected', () => {
    const result = service.calculate(
      {
        poleSpacingFt: 10,
        poleRate: 450,
        supportPillarsRequired: true,
        supportPillarCount: 3,
        installationRequired: true,
        wireRounds: 3,
        wireBrand: 'standard',
        wireRatePerKg: 105
      },
      100
    );

    expect(result.totalPillars).toBe(13);
    expect(result.installationCost).toBe(1430);
    expect(result.total).toBe(8330);
  });

  it('rejects invalid support pillar counts', () => {
    expect(service.validateSupportPillars(true, 0)).toEqual({
      valid: false,
      message: 'Enter the number of support pillars.'
    });
    expect(service.validateSupportPillars(true, -1)).toEqual({
      valid: false,
      message: 'Enter the number of support pillars.'
    });
  });
});
