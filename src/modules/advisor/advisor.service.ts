import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AdvisorSession } from './advisor.entity';
import { Product } from '../products/product.entity';

interface Appliance {
  name: string;
  watts: number;
  quantity: number;
  hoursPerDay: number;
  unit?: string;
}

interface Preferences {
  location: string;
  sunHours: number;
  backupFactor: number;
  gridSituation: 'none' | 'unreliable' | 'reliable';
  priority: 'all' | 'budget' | 'quality' | 'compact';
}

const FALLBACK_PRICES = `NGN PRICES 2025:
400W panel ₦160k-220k | 550W ₦210k-290k | 580W+ ₦240k-330k
200Ah LiFePO4 48V ₦780k-980k | 200Ah AGM 12V ₦185k-245k
5.12kWh LiFePO4 pack ₦920k-1.35M
Inverters: 3kVA ₦200k-520k, 5kVA ₦400k-950k, 8kVA ₦650k-1.3M, 10kVA ₦850k-1.7M, 12kVA ₦1M-2.1M
MPPT: 40A ₦90k-160k, 80A ₦200k-440k | Accessories ₦70k-200k`;

const ADVISOR_PROMPT = (
  appTxt: string,
  totalWh: number,
  totalW: number,
  prefs: Preferences,
  priceContext?: string,
) => `
You are a professional solar systems engineer for the Nigerian residential off-grid/hybrid market.

Design THREE complete solar system recommendations.

LOAD:
${appTxt}
Peak Load: ${totalW}W
Daily Energy: ${totalWh}Wh/day
Sun Hours: ${prefs.sunHours}h/day
Backup Factor: ${prefs.backupFactor}x
Grid: ${prefs.gridSituation}

ENGINEERING RULES:
1. Adjusted load = totalWh × 1.25 (system losses)
2. System voltage: 48V if adj≥5kWh, 24V if adj≥2kWh, else 12V
3. Panels: ceil(adj / sunH × 1.3 / panelW)
4. Batteries: ceil(adj × backup / (DoD × sysV × battAh)). LiFePO4 DoD=0.95, AGM DoD=0.5
5. Inverter: ceil(peakW × 1.3) round up to: 1,1.5,2,3,3.5,5,7.5,8,10,12kVA
6. MPPT: ceil(panelTotal / sysV × 1.25)

REC1 "budget" "💰": AGM 200Ah, 400W panels, pure sine inverter + separate MPPT controller
REC2 "performance" "🏆": LiFePO4, 550W N-type, hybrid inverter (built-in MPPT + grid failover)
REC3 "spacesaver" "📦": LiFePO4 stackable packs (5.12kWh each), all-in-one hybrid (Deye/Growatt), NO separate controller (null), 580W+ panels

${priceContext || FALLBACK_PRICES}

Return ONLY valid JSON (no markdown):
{
  "adjustedDailyLoad": <Wh>,
  "peakLoad": <W>,
  "recommendations": [
    {
      "id": "budget",
      "title": "Budget Build",
      "icon": "💰",
      "tagline": "<one line>",
      "focus": "<brief>",
      "pros": ["<3 items>"],
      "cons": ["<2 items>"],
      "systemVoltage": <V>,
      "panels": {"quantity":<n>,"wattageEach":<W>,"totalWattage":<W>,"type":"<t>","arrangement":"<s>"},
      "batteries": {"quantity":<n>,"capacityAhOrWh":"<e.g.200Ah>","voltageEach":<V>,"type":"AGM","totalWhUsable":<Wh>,"arrangement":"<s>"},
      "inverter": {"capacityKva":<n>,"type":"<t>","dcInputVoltage":<V>,"model":"<example>","hasBuiltInMppt":<bool>,"hasGridFailover":<bool>},
      "chargeController": {"type":"MPPT","currentA":<n>,"maxPvVoltage":<V>,"model":"<example>"},
      "otherComponents": [{"item":"<n>","qty":"<q>","spec":"<s>","purpose":"<p>"}],
      "estimatedCostNGN": {"panels":"₦X–₦Y","batteries":"₦X–₦Y","inverter":"₦X–₦Y","controller":"₦X–₦Y","accessories":"₦X–₦Y","totalMin":<n>,"totalMax":<n>},
      "notes": ["<4 notes>"],
      "warnings": []
    },
    { "id":"performance","title":"Premium Performance","icon":"🏆" ... },
    { "id":"spacesaver","title":"All-in-One Compact","icon":"📦", "chargeController": null ... }
  ]
}`;

@Injectable()
export class AdvisorService {
  private readonly logger = new Logger(AdvisorService.name);
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(AdvisorSession)
    private readonly sessionRepo: Repository<AdvisorSession>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly cfg: ConfigService,
  ) {
    this.anthropic = new Anthropic({ apiKey: cfg.get('anthropic.apiKey') });
  }

  async calculate(
    appliances: Appliance[],
    preferences: Preferences,
    userId?: string,
  ): Promise<{ session: AdvisorSession; results: any }> {
    const totalW = appliances.reduce((s, a) => s + a.watts * a.quantity, 0);
    const totalWh = appliances.reduce(
      (s, a) => s + a.watts * a.quantity * (a.hoursPerDay || 8), 0,
    );

    const appTxt = appliances
      .map(a => `- ${a.name} (×${a.quantity}): ${a.watts}W × ${a.hoursPerDay}h = ${Math.round(a.watts * a.quantity * a.hoursPerDay)}Wh/day`)
      .join('\n');

    // Fetch live prices from marketplace (non-fatal)
    const priceContext = await this.getProductPriceContext().catch(() => '');

    let results: any;

    try {
      const response = await this.anthropic.messages.create({
        model: this.cfg.get('anthropic.advisorModel', 'claude-sonnet-4-6'),
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: ADVISOR_PROMPT(appTxt, totalWh, totalW, preferences, priceContext || undefined),
        }],
      });

      const raw = (response.content[0] as any).text || '';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]+\}/);
      results = match ? JSON.parse(match[0]) : this.fallbackCalc(appliances, totalW, totalWh, preferences);
    } catch (err) {
      this.logger.warn(`Advisor AI failed, using fallback: ${err.message}`);
      results = this.fallbackCalc(appliances, totalW, totalWh, preferences);
    }

    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        userId,
        appliances,
        preferences,
        results,
        totalWh,
        peakWatts: totalW,
      }),
    );

    return { session, results };
  }

  // ── Marketplace items for a specific recommendation ───────────
  async getMarketplaceItemsForSession(
    sessionId: string,
    tier: string,
    preference: 'budget' | 'quality' | 'balanced' = 'balanced',
  ) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session?.results) throw new NotFoundException('Session not found');

    const rec = (session.results as any).recommendations?.find((r: any) => r.id === tier);
    if (!rec) throw new NotFoundException(`Recommendation "${tier}" not found`);

    const panelW = rec.panels?.wattageEach || 400;
    const battType: string = rec.batteries?.type || '';
    const battSearch = battType.includes('LiFePO4') ? 'lifepo4 battery'
      : battType.includes('AGM') ? 'agm battery'
      : 'solar battery';
    const invKva = rec.inverter?.capacityKva || 5;
    const invSearch = rec.inverter?.hasBuiltInMppt ? `${invKva}kva hybrid inverter` : `${invKva}kva inverter`;
    const ctrlA = rec.chargeController?.currentA || 40;

    const fetch = (q: string, limit = 6) =>
      this.buildProductQuery(q, preference).take(limit).getMany();

    const [panels, batteries, inverters, controllers, accessories] = await Promise.all([
      fetch(`${panelW}W solar panel`),
      fetch(battSearch),
      fetch(invSearch),
      rec.chargeController ? fetch(`MPPT ${ctrlA}A charge controller`) : Promise.resolve([]),
      fetch('solar cable MC4'),
    ]);

    const fmt = (products: Product[]) =>
      products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        currency: (p as any).currency || 'NGN',
        thumbnail: p.thumbnail,
        averageRating: Number(p.averageRating),
        reviewCount: p.reviewCount,
        brand: p.brand,
        location: [p.sellerCity, p.sellerState].filter(Boolean).join(', '),
      }));

    return {
      tier,
      preference,
      recommendation: {
        panels: { quantity: rec.panels?.quantity, wattageEach: panelW },
        batteries: { quantity: rec.batteries?.quantity, type: battType, capacity: rec.batteries?.capacityAhOrWh },
        inverter: { capacityKva: invKva, type: rec.inverter?.type },
        chargeController: rec.chargeController ? { currentA: ctrlA } : null,
      },
      products: {
        panels: fmt(panels),
        batteries: fmt(batteries),
        inverters: fmt(inverters),
        controllers: fmt(controllers),
        accessories: fmt(accessories),
      },
    };
  }

  // ── Live price context for Claude prompt ──────────────────────
  private async getProductPriceContext(): Promise<string> {
    type PriceQuery = { label: string; terms: string[] };
    const queries: PriceQuery[] = [
      { label: 'Solar Panels (400W)',    terms: ['400W panel', 'solar panel 400'] },
      { label: 'Solar Panels (550W+)',   terms: ['550W panel', '580W panel', '550 solar'] },
      { label: 'LiFePO4 Batteries',     terms: ['lifepo4', 'lithium battery'] },
      { label: 'AGM Batteries',         terms: ['agm battery', 'gel battery'] },
      { label: 'Hybrid Inverters',      terms: ['hybrid inverter', 'deye', 'growatt'] },
      { label: 'Pure Sine Inverters',   terms: ['pure sine inverter', 'luminous inverter'] },
      { label: 'MPPT Controllers',      terms: ['mppt controller', 'mppt charge'] },
    ];

    const lines: string[] = [];

    for (const { label, terms } of queries) {
      try {
        const params: Record<string, string> = {};
        terms.forEach((t, i) => { params[`t${i}`] = `%${t}%`; });

        const products = await this.productRepo.createQueryBuilder('p')
          .where('p.status = :st', { st: 'active' })
          .andWhere('p.stock > 0')
          .andWhere(
            '(' + terms.map((_, i) => `p.name ILIKE :t${i}`).join(' OR ') + ')',
            params,
          )
          .select(['p.price'])
          .take(40)
          .getMany();

        if (!products.length) continue;

        const prices = products.map(p => Number(p.price)).filter(p => p > 0).sort((a, b) => a - b);
        const min = prices[0];
        const max = prices[prices.length - 1];
        lines.push(`${label}: ₦${min.toLocaleString()}–₦${max.toLocaleString()} (${prices.length} listings)`);
      } catch {
        // skip category on error
      }
    }

    if (!lines.length) return '';
    return `CURRENT SOLAR MAKET LIVE PRICES (updated from marketplace):\n${lines.join('\n')}\nUse these for cost estimates; fall back to your training data if a category is missing.`;
  }

  private buildProductQuery(
    search: string,
    preference: string,
  ): SelectQueryBuilder<Product> {
    let qb = this.productRepo.createQueryBuilder('p')
      .where('p.status = :st', { st: 'active' })
      .andWhere('p.stock > 0')
      .andWhere('(p.name ILIKE :q OR p.brand ILIKE :q)', { q: `%${search}%` })
      .select([
        'p.id', 'p.name', 'p.slug', 'p.price', 'p.thumbnail',
        'p.averageRating', 'p.reviewCount', 'p.brand',
        'p.sellerCity', 'p.sellerState', 'p.stock',
      ]);

    if (preference === 'budget') {
      qb = qb.orderBy('p.price', 'ASC');
    } else if (preference === 'quality') {
      qb = qb.orderBy('p.averageRating', 'DESC').addOrderBy('p.reviewCount', 'DESC');
    } else {
      qb = qb.orderBy('p.averageRating', 'DESC').addOrderBy('p.price', 'ASC');
    }

    return qb;
  }

  async getSession(id: string): Promise<AdvisorSession> {
    return this.sessionRepo.findOne({ where: { id } });
  }

  async getUserSessions(userId: string): Promise<AdvisorSession[]> {
    return this.sessionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async saveSelection(sessionId: string, recommendationId: string): Promise<void> {
    await this.sessionRepo.update(sessionId, { selectedRecommendation: recommendationId });
  }

  // ── Engineering fallback (no AI) ──────────────────────────────
  private fallbackCalc(
    appliances: Appliance[],
    totalW: number,
    totalWh: number,
    prefs: Preferences,
  ): any {
    const adj = Math.round(totalWh * 1.25);
    const sysV = adj >= 5000 ? 48 : adj >= 2000 ? 24 : 12;
    const { sunHours: sh, backupFactor: bk } = prefs;

    const make = (type: 'budget' | 'performance' | 'spacesaver') => {
      const pW  = type === 'spacesaver' ? 580 : type === 'performance' ? 550 : 400;
      const pQ  = Math.ceil(adj / sh * 1.3 / pW);
      const dod = type === 'budget' ? 0.5 : 0.95;
      const bAh = 200, bV = sysV;
      const bQ  = Math.ceil(adj * bk / (dod * bV * bAh));
      const inv = Math.max(1.5, Math.ceil(totalW * 1.3 / 1000 * 2) / 2);
      const cA  = Math.ceil(pW * pQ / sysV * 1.25);

      const pCost = { mn: pQ * (type === 'budget' ? 160000 : 210000), mx: pQ * (type === 'budget' ? 220000 : 310000) };
      const bCost = type === 'budget'
        ? { mn: bQ * 185000, mx: bQ * 245000 }
        : type === 'spacesaver'
          ? { mn: Math.ceil(adj * bk / 4864) * 920000, mx: Math.ceil(adj * bk / 4864) * 1350000 }
          : { mn: bQ * 780000, mx: bQ * 980000 };
      const iCost = { mn: inv * 160000, mx: inv * 300000 };
      const cCost = type === 'spacesaver' ? { mn: 0, mx: 0 } : { mn: 90000, mx: 400000 };
      const aC   = { mn: 70000, mx: 180000 };

      return {
        systemVoltage: sysV,
        panels: { quantity: pQ, wattageEach: pW, totalWattage: pQ * pW, type: type === 'budget' ? 'Polycrystalline' : 'Monocrystalline N-Type', arrangement: `${pQ} panels in parallel` },
        batteries: { quantity: type === 'spacesaver' ? Math.ceil(adj * bk / 4864) : bQ, capacityAhOrWh: type === 'spacesaver' ? '5.12kWh' : `${bAh}Ah`, voltageEach: type === 'spacesaver' ? 51.2 : bV, type: type === 'budget' ? 'AGM' : 'LiFePO4', totalWhUsable: Math.round(type === 'spacesaver' ? Math.ceil(adj * bk / 4864) * 4864 : bQ * bAh * bV * dod), arrangement: type === 'spacesaver' ? 'Stacked packs' : `${bQ} × ${bV}V parallel` },
        inverter: { capacityKva: inv, type: type === 'spacesaver' ? 'All-in-One Hybrid' : type === 'performance' ? 'Hybrid (MPPT + Grid Failover)' : 'Pure Sine Wave', dcInputVoltage: sysV, model: type === 'spacesaver' ? `Deye SUN-${inv * 2}K` : type === 'performance' ? `Victron MultiPlus-II ${inv}kVA` : `Luminous ${inv}kVA Pure Sine`, hasBuiltInMppt: type !== 'budget', hasGridFailover: type !== 'budget' && prefs.gridSituation !== 'none' },
        chargeController: type === 'spacesaver' ? null : { type: 'MPPT', currentA: cA, maxPvVoltage: 150, model: cA > 60 ? `Victron SmartSolar 150/${Math.ceil(cA / 10) * 10}` : `Renogy Rover ${Math.ceil(cA / 10) * 10}A` },
        otherComponents: [
          { item: 'MC4 Connectors', qty: `${pQ} pairs`, spec: 'IP67', purpose: 'Panel wiring' },
          { item: 'DC Breaker', qty: '1', spec: `${cA}A`, purpose: 'PV array protection' },
          { item: 'Battery Fuse', qty: '1', spec: '200–400A', purpose: 'Battery protection' },
          { item: 'Solar Cable', qty: 'as needed', spec: '6mm²', purpose: 'Panel-to-controller' },
        ],
        estimatedCostNGN: { panels: `₦${pCost.mn.toLocaleString()}–₦${pCost.mx.toLocaleString()}`, batteries: `₦${bCost.mn.toLocaleString()}–₦${bCost.mx.toLocaleString()}`, inverter: `₦${iCost.mn.toLocaleString()}–₦${iCost.mx.toLocaleString()}`, controller: type === 'spacesaver' ? 'Included in inverter' : `₦${cCost.mn.toLocaleString()}–₦${cCost.mx.toLocaleString()}`, accessories: `₦${aC.mn.toLocaleString()}–₦${aC.mx.toLocaleString()}`, totalMin: pCost.mn + bCost.mn + iCost.mn + cCost.mn + aC.mn, totalMax: pCost.mx + bCost.mx + iCost.mx + cCost.mx + aC.mx },
        pros: type === 'budget' ? ['Lowest upfront cost', 'Widely available', 'Standard install'] : type === 'performance' ? ['10yr battery lifespan', 'Best efficiency', 'Best 10yr ROI'] : ['Fewest components', 'WiFi monitoring', 'Minimal wiring'],
        cons: type === 'budget' ? ['AGM lasts 3–5yrs', 'Higher 10yr cost'] : type === 'performance' ? ['Highest upfront cost', 'Certified install needed'] : ['Single unit failure risk', 'Less flexible'],
        notes: ['Use a certified solar installer', 'Get a site survey first', 'Verify local stock availability', 'Size for startup surges'],
        warnings: totalW > 5000 ? ['High peak load — confirm inverter surge rating'] : [],
      };
    };

    return {
      adjustedDailyLoad: adj,
      peakLoad: Math.round(totalW),
      recommendations: [
        { id: 'budget',      title: 'Budget Build',         icon: '💰', tagline: 'Lowest upfront cost',        focus: 'Best for tight budgets', ...make('budget') },
        { id: 'performance', title: 'Premium Performance',  icon: '🏆', tagline: 'Best ROI over 10+ years',    focus: 'Quality & longevity',    ...make('performance') },
        { id: 'spacesaver',  title: 'All-in-One Compact',   icon: '📦', tagline: 'Fewer parts, simpler install', focus: 'Minimal footprint',     ...make('spacesaver') },
      ],
    };
  }
}
