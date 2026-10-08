import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';
import { FencingCalculatorService, WireOption } from './fencing-calculator.service';

type ProductType = 'boundary-wall' | 'barbed-fencing';
type MeasurementType = 'area' | 'perimeter';

interface QuoteField {
  id: number;
  measurementType: MeasurementType;
  displayText: string;
  biswa?: number;
  perimeterFeet?: number;
}

interface QuoteExpense {
  id: number;
  name: string;
  description: string;
  amount: number;
}

interface BreakdownLine {
  label: string;
  value: string;
}

interface QuoteResult {
  productName: string;
  totalArea: number;
  perimeterFeet: number;
  perimeterMeters: number;
  wallHeight?: number;
  wallArea?: number;
  poles?: number;
  wireWeight?: number;
  lines: BreakdownLine[];
  total: number;
}

@Component({
  selector: 'qc-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('estimateCard') private estimateCard?: ElementRef<HTMLElement>;

  readonly biswaToSqFt = 1350;
  readonly boundaryWallRate = 85;
  readonly wallHeights = [4, 5, 6, 7, 8, 9, 10];
  readonly wireRoundOptions = [3, 4, 5, 6];
  readonly wireOptions: WireOption[] = [
    { id: 'standard', brand: 'Standard', specification: 'Heavy duty', ratePerKg: 105 },
    { id: 'premium', brand: 'Premium', specification: 'Premium quality', ratePerKg: 120 },
    { id: 'heavy-duty', brand: 'Heavy duty', specification: 'High strength', ratePerKg: 150 }
  ];

  productType: ProductType = 'boundary-wall';
  measurementType: MeasurementType = 'area';
  areaBiswa = 1;
  customPerimeter: number | null = null;
  wallHeight = 6;

  poleSpacingFt = 10;
  poleRate = 450;
  supportPillarsRequired = false;
  supportPillarCount = 0;
  installationRequired = false;
  wireRounds = 3;
  selectedWireBrand = 'standard';
  wireRatePerKg = 105;

  fields: QuoteField[] = [];
  expenses: QuoteExpense[] = [];
  showExpenseForm = false;
  expenseName = '';
  expenseDescription = '';
  expenseAmount: number | null = null;
  message = '';
  result: QuoteResult | null = null;
  private nextFieldId = 1;
  private nextExpenseId = 1;
  private animationContext?: gsap.Context;

  constructor(private readonly fencingCalculator: FencingCalculatorService) {}

  ngAfterViewInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.animationContext = gsap.context(() => {
      gsap.from('.animate-in', {
        y: 16,
        opacity: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: 'power2.out'
      });
    });
  }

  ngOnDestroy(): void {
    this.animationContext?.revert();
  }

  chooseProduct(type: ProductType): void {
    this.productType = type;
    this.result = null;
    this.message = '';
  }

  chooseMeasurement(type: MeasurementType): void {
    this.measurementType = type;
    this.message = '';
  }

  onSupportPillarsToggle(): void {
    if (!this.supportPillarsRequired) {
      this.supportPillarCount = 0;
    }
    this.result = null;
    this.message = '';
  }

  onInstallationToggle(): void {
    this.result = null;
    this.message = '';
  }

  onWireBrandChange(): void {
    const selected = this.wireOptions.find((wire) => wire.id === this.selectedWireBrand);
    if (selected) {
      this.wireRatePerKg = selected.ratePerKg;
    }
  }

  addField(): void {
    if (this.measurementType === 'area') {
      const biswa = Number(this.areaBiswa);
      if (!Number.isFinite(biswa) || biswa <= 0) {
        this.message = 'Enter a land area greater than zero.';
        return;
      }

      this.fields.push({
        id: this.nextFieldId++,
        measurementType: 'area',
        biswa,
        displayText: `${biswa.toLocaleString('en-IN')} Biswa`
      });
    } else {
      const perimeter = Number(this.customPerimeter);
      if (!Number.isFinite(perimeter) || perimeter <= 0) {
        this.message = 'Enter running feet greater than zero.';
        return;
      }

      this.fields.push({
        id: this.nextFieldId++,
        measurementType: 'perimeter',
        perimeterFeet: perimeter,
        displayText: `${perimeter.toLocaleString('en-IN')} running ft`
      });
      this.customPerimeter = null;
    }

    this.result = null;
    this.message = '';
  }

  removeField(id: number): void {
    this.fields = this.fields.filter((field) => field.id !== id);
    this.result = null;
  }

  addExpense(): void {
    const name = this.expenseName.trim();
    const amount = Number(this.expenseAmount);
    if (!name || !Number.isFinite(amount) || amount <= 0) {
      this.message = 'Enter an expense name and an amount greater than zero.';
      return;
    }

    this.expenses.push({
      id: this.nextExpenseId++,
      name,
      description: this.expenseDescription.trim(),
      amount
    });
    this.expenseName = '';
    this.expenseDescription = '';
    this.expenseAmount = null;
    this.showExpenseForm = false;
    this.message = '';
    this.recalculateIfShown();
  }

  removeExpense(id: number): void {
    this.expenses = this.expenses.filter((expense) => expense.id !== id);
    this.recalculateIfShown();
  }

  get totalBiswa(): number {
    return this.fields.reduce((total, field) => total + (field.biswa ?? 0), 0);
  }

  get totalArea(): number {
    return Math.round(this.totalBiswa * this.biswaToSqFt);
  }

  get hasAreaMeasurements(): boolean {
    return this.fields.some((field) => field.measurementType === 'area');
  }

  get totalPerimeter(): number {
    return this.fields.reduce((total, field) => {
      if (field.measurementType === 'perimeter') {
        return total + (field.perimeterFeet ?? 0);
      }

      const area = (field.biswa ?? 0) * this.biswaToSqFt;
      return total + 4 * Math.sqrt(area);
    }, 0);
  }

  get selectedWire(): WireOption {
    return this.wireOptions.find((wire) => wire.id === this.selectedWireBrand) ?? this.wireOptions[0];
  }

  calculate(): void {
    if (this.fields.length === 0) {
      this.message = 'Add at least one land measurement to calculate a quotation.';
      this.result = null;
      return;
    }

    const perimeterFeet = this.totalPerimeter;
    const totalArea = this.totalArea;
    const perimeterMeters = Math.round(perimeterFeet * 0.3048 * 10) / 10;
    const expenseTotal = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const baseLines: BreakdownLine[] = [
      { label: 'Measurements included', value: String(this.fields.length) },
      ...(this.hasAreaMeasurements
        ? [{ label: 'Total land area', value: `${totalArea.toLocaleString('en-IN')} sq ft` }]
        : []),
      { label: 'Total perimeter', value: `${Math.round(perimeterFeet).toLocaleString('en-IN')} ft (${perimeterMeters} m)` }
    ];

    if (this.productType === 'boundary-wall') {
      this.calculateBoundaryWall(baseLines, perimeterFeet, expenseTotal);
      this.scrollToEstimateOnMobile();
      return;
    }

    this.calculateFencing(baseLines, perimeterFeet, expenseTotal);
    this.scrollToEstimateOnMobile();
  }

  reset(): void {
    this.productType = 'boundary-wall';
    this.measurementType = 'area';
    this.areaBiswa = 1;
    this.customPerimeter = null;
    this.wallHeight = 6;
    this.poleSpacingFt = 10;
    this.poleRate = 450;
    this.supportPillarsRequired = false;
    this.supportPillarCount = 0;
    this.installationRequired = false;
    this.wireRounds = 3;
    this.selectedWireBrand = 'standard';
    this.wireRatePerKg = 105;
    this.fields = [];
    this.expenses = [];
    this.result = null;
    this.message = '';
  }

  shareOnWhatsApp(): void {
    if (!this.result) {
      return;
    }

    const text = [
      'SURAKSHA WALLS',
      'सुरक्षा हमारी, विश्वास आपका',
      'सुरक्षा वॉल्स · पिलर जाली उद्योग',
      '',
      `QUOTATION ESTIMATE · ${this.result.productName}`,
      `Total: ${this.formatCurrency(this.result.total)}`,
      `Perimeter: ${this.result.perimeterFeet} ft (${this.result.perimeterMeters} m)`,
      ...this.result.lines.map((line) => `${line.label}: ${line.value}`),
      '',
      'Note: This is a quotation estimate. Actual cost may vary and will be finalized after site completion.',
      '',
      'Contact: 8090272727 | 9506629814',
      'www.surakshawalls.shop'
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  printQuote(): void {
    if (this.result) {
      window.print();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  private calculateBoundaryWall(
    baseLines: BreakdownLine[],
    perimeterFeet: number,
    expenseTotal: number
  ): void {
    const wallArea = Math.round(perimeterFeet * this.wallHeight);
    const wallCost = Math.round(wallArea * this.boundaryWallRate);
    const total = wallCost + expenseTotal;

    this.result = {
      productName: 'Precast Boundary Wall',
      totalArea: this.totalArea,
      perimeterFeet: Math.round(perimeterFeet),
      perimeterMeters: Math.round(perimeterFeet * 0.3048 * 10) / 10,
      wallHeight: this.wallHeight,
      wallArea,
      lines: [
        ...baseLines,
        { label: `Wall area (${this.wallHeight} ft high)`, value: `${wallArea.toLocaleString('en-IN')} sq ft` },
        { label: 'All-inclusive wall rate', value: `${this.formatCurrency(this.boundaryWallRate)} / sq ft` },
        { label: 'Wall work', value: this.formatCurrency(wallCost) },
        { label: 'Installation', value: 'Included in rate' }
      ],
      total: Math.round(total)
    };

    if (this.expenses.length) {
      this.result.lines.push(
        ...this.expenses.map((expense) => ({
          label: expense.name,
          value: this.formatCurrency(expense.amount)
        }))
      );
    }

    this.message = '';
  }

  private calculateFencing(baseLines: BreakdownLine[], perimeterFeet: number, expenseTotal: number): void {
    const validation = this.fencingCalculator.validateSupportPillars(
      this.supportPillarsRequired,
      this.supportPillarCount
    );

    if (!validation.valid) {
      this.message = validation.message ?? 'Enter the number of support pillars.';
      this.result = null;
      return;
    }

    const configuration = {
      poleSpacingFt: Number(this.poleSpacingFt) || 10,
      poleRate: Number(this.poleRate) || 450,
      supportPillarsRequired: this.supportPillarsRequired,
      supportPillarCount: this.supportPillarsRequired ? Number(this.supportPillarCount) : 0,
      installationRequired: this.installationRequired,
      wireRounds: Number(this.wireRounds) || 3,
      wireBrand: this.selectedWireBrand,
      wireRatePerKg: Number(this.wireRatePerKg) || this.selectedWire.ratePerKg
    };

    const calculation = this.fencingCalculator.calculate(configuration, perimeterFeet);
    const total = calculation.total + expenseTotal;
    const lines: BreakdownLine[] = [
      ...baseLines,
      { label: 'Base pillars', value: `${calculation.basePillars.toLocaleString('en-IN')} × ${this.formatCurrency(configuration.poleRate)}` },
      { label: 'Support pillars', value: `${calculation.supportPillars.toLocaleString('en-IN')} × ${this.formatCurrency(configuration.poleRate)}` },
      { label: 'Total pillars', value: `${calculation.totalPillars.toLocaleString('en-IN')}` },
      { label: 'Pole cost', value: `${this.formatCurrency(calculation.poleCost)}` },
      { label: 'Wire', value: `${calculation.wireRounds} rounds` },
      { label: 'Barbed wire', value: `${calculation.wireWeightKg.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg × ${this.formatCurrency(calculation.wireRatePerKg)} · ${this.formatCurrency(calculation.wireCost)}` },
      {
        label: 'Installation package (labour, transport, loading/unloading)',
        value: this.installationRequired
          ? `${calculation.totalPillars} × ${this.formatCurrency(this.fencingCalculator.installationRatePerPillar)} · ${this.formatCurrency(calculation.installationCost)}`
          : 'Not included'
      }
    ];

    if (this.expenses.length) {
      lines.push(
        ...this.expenses.map((expense) => ({
          label: expense.name,
          value: this.formatCurrency(expense.amount)
        }))
      );
    }

    this.result = {
      productName: 'Barbed Wire Fencing',
      totalArea: this.totalArea,
      perimeterFeet: Math.round(perimeterFeet),
      perimeterMeters: Math.round(perimeterFeet * 0.3048 * 10) / 10,
      poles: calculation.totalPillars,
      wireWeight: calculation.wireWeightKg,
      lines,
      total: Math.round(total)
    };

    this.message = '';
  }

  private recalculateIfShown(): void {
    if (this.result) {
      this.calculate();
    }
  }

  private scrollToEstimateOnMobile(): void {
    if (!this.result || !window.matchMedia('(max-width: 820px)').matches) {
      return;
    }

    requestAnimationFrame(() => {
      this.estimateCard?.nativeElement.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  }
}
