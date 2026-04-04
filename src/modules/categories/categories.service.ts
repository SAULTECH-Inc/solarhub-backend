import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { Category } from './category.entity';
import { RedisService } from '../redis/redis.service';

// Mirror the entity's specSchema value shape so seed literals are typed correctly.
type SpecField = {
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  unit?: string;
  options?: string[];
  required: boolean;
  group?: string;
};

type SeedCategory = {
  name: string;
  slug: string;
  icon: string;
  description: string;
  specSchema: Record<string, SpecField>;
};

const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: 'Solar Panels',   slug: 'solar-panels',   icon: '☀️',
    description: 'PV modules — Mono, Poly, Bifacial, HJT, PERC',
    specSchema: {
      panelType:      { label:'Panel Type', type:'select', options:['Monocrystalline','Polycrystalline','Bifacial Mono','HJT','PERC','Thin-Film'], required:true, group:'Electrical' },
      pmaxWp:         { label:'Peak Power – Pmax (Wp)', type:'number', unit:'Wp', required:true, group:'Electrical' },
      vocV:           { label:'Open Circuit Voltage – Voc', type:'number', unit:'V', required:true, group:'Electrical' },
      vmpV:           { label:'Max Power Voltage – Vmp', type:'number', unit:'V', required:true, group:'Electrical' },
      iscA:           { label:'Short Circuit Current – Isc', type:'number', unit:'A', required:true, group:'Electrical' },
      impA:           { label:'Max Power Current – Imp', type:'number', unit:'A', required:false, group:'Electrical' },
      efficiencyPct:  { label:'Module Efficiency', type:'number', unit:'%', required:true, group:'Electrical' },
      tempCoeff:      { label:'Temp. Coefficient Pmax', type:'number', unit:'%/°C', required:false, group:'Electrical' },
      dimensionsMm:   { label:'Dimensions (L×W×H mm)', type:'text', required:false, group:'Physical' },
      weightKg:       { label:'Weight', type:'number', unit:'kg', required:false, group:'Physical' },
      cellCount:      { label:'Cell Count', type:'number', required:false, group:'Physical' },
      connectorType:  { label:'Connector Type', type:'select', options:['MC4','MC4-Evo2','H4','Other'], required:false, group:'Physical' },
      maxSysVoltage:  { label:'Max System Voltage', type:'number', unit:'V', required:false, group:'Physical' },
      certifications: { label:'Certifications', type:'text', required:false, group:'Quality' },
    },
  },
  {
    name: 'Batteries',  slug: 'batteries',  icon: '🔋',
    description: 'Solar storage — LiFePO4, AGM, Gel, Flooded Lead-Acid',
    specSchema: {
      chemistry:     { label:'Chemistry', type:'select', options:['LiFePO4','NMC','AGM','Gel','Flooded Lead-Acid'], required:true, group:'Chemistry' },
      capacityAh:    { label:'Nominal Capacity (Ah)', type:'number', unit:'Ah', required:true, group:'Chemistry' },
      voltageV:      { label:'Nominal Voltage', type:'number', unit:'V', required:true, group:'Chemistry' },
      dodPct:        { label:'Depth of Discharge (DoD)', type:'number', unit:'%', required:true, group:'Chemistry' },
      cycleLife:     { label:'Cycle Life', type:'number', unit:'cycles', required:true, group:'Chemistry' },
      chargeRate:    { label:'Max Charge Rate', type:'text', required:false, group:'Performance' },
      dischargeRate: { label:'Max Discharge Rate', type:'text', required:false, group:'Performance' },
      hasBms:        { label:'BMS Included', type:'select', options:['Yes – Built-in','No – External'], required:true, group:'Performance' },
      weightKg:      { label:'Weight', type:'number', unit:'kg', required:false, group:'Physical' },
      certifications:{ label:'Certifications', type:'text', required:false, group:'Quality' },
    },
  },
  {
    name: 'Inverters',  slug: 'inverters',  icon: '⚡',
    description: 'Pure Sine, Hybrid, Grid-Tie, All-in-One',
    specSchema: {
      inverterType:  { label:'Inverter Type', type:'select', options:['Pure Sine Wave Off-Grid','Hybrid (Built-in MPPT + Grid Failover)','All-in-One (Inverter + Battery)','Grid-Tie','Bi-directional/UPS'], required:true, group:'Power' },
      continuousW:   { label:'Continuous Output Power', type:'number', unit:'W', required:true, group:'Power' },
      surgeW:        { label:'Surge/Peak Power', type:'number', unit:'W', required:false, group:'Power' },
      efficiencyPct: { label:'Efficiency', type:'number', unit:'%', required:false, group:'Power' },
      dcInputV:      { label:'DC Input Voltage', type:'select', options:['12','24','48'], required:true, group:'Input/Output' },
      acOutputV:     { label:'AC Output Voltage', type:'number', unit:'V', required:false, group:'Input/Output' },
      hasBuiltInMppt:{ label:'Built-in MPPT', type:'select', options:['No','Yes – Single','Yes – Dual'], required:false, group:'Features' },
      hasGridFailover:{ label:'Grid Auto-Failover', type:'select', options:['No','Yes – Automatic'], required:false, group:'Features' },
      communication: { label:'Communication Ports', type:'text', required:false, group:'Features' },
      certifications:{ label:'Certifications', type:'text', required:false, group:'Quality' },
    },
  },
  {
    name: 'Charge Controllers', slug: 'charge-controllers', icon: '🔌',
    description: 'MPPT and PWM charge controllers',
    specSchema: {
      ctrlType:      { label:'Controller Type', type:'select', options:['MPPT','PWM'], required:true, group:'Ratings' },
      maxPvVocV:     { label:'Max PV OC Voltage', type:'number', unit:'V', required:true, group:'Ratings' },
      chargeCurrentA:{ label:'Rated Charge Current', type:'number', unit:'A', required:true, group:'Ratings' },
      maxEffPct:     { label:'Max Efficiency', type:'number', unit:'%', required:false, group:'Ratings' },
      systemVoltage: { label:'System Voltage', type:'select', options:['Auto 12/24/48V','12V','24V','48V'], required:false, group:'System' },
      communication: { label:'Communication', type:'text', required:false, group:'Features' },
    },
  },
  {
    name: 'Solar Lights',   slug: 'solar-lights',   icon: '💡',
    description: 'Solar-powered lighting — Street, Garden, Flood, Security',
    specSchema: {
      lightType:     { label:'Light Type', type:'select', options:['Street Light','Garden Light','Flood Light','Security Light','Lantern','Panel Light'], required:true, group:'Output' },
      lumens:        { label:'Lumens (lm)', type:'number', unit:'lm', required:true, group:'Output' },
      ledPowerW:     { label:'LED Power', type:'number', unit:'W', required:false, group:'Output' },
      colorTempK:    { label:'Color Temperature', type:'text', unit:'K', required:false, group:'Output' },
      panelW:        { label:'Integrated Panel Wattage', type:'number', unit:'W', required:true, group:'Solar' },
      batteryAh:     { label:'Battery Capacity', type:'number', unit:'Ah', required:false, group:'Solar' },
      lightingHrs:   { label:'Lighting Duration', type:'number', unit:'hours', required:true, group:'Solar' },
      ipRating:      { label:'IP Rating', type:'text', required:true, group:'Protection' },
    },
  },
  {
    name: 'Accessories',    slug: 'accessories',    icon: '🔧',
    description: 'Cables, connectors, mounting structures, breakers, meters',
    specSchema: {
      accessoryType: { label:'Accessory Type', type:'select', options:['DC Solar Cable','MC4 Connector','Panel Mounting Structure','Battery Cable','Fuse/Circuit Breaker','Junction Box','Energy Meter','Cable Lug','Other'], required:true, group:'Type' },
      keySpec:       { label:'Key Specification', type:'text', required:true, group:'Type' },
      voltageRating: { label:'Voltage Rating', type:'text', required:false, group:'Ratings' },
      currentRating: { label:'Current Rating', type:'number', unit:'A', required:false, group:'Ratings' },
      ipRating:      { label:'IP/Protection Rating', type:'text', required:false, group:'Protection' },
      quantityUnit:  { label:'Sold Per', type:'select', options:['Piece','Metre','Roll (50m)','Pair','Set'], required:false, group:'Pricing' },
    },
  },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly repo: TreeRepository<Category>,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    try {
      await this.seedCategories();
    } catch (err) {
      this.logger.error(
        'Category seeding failed — database schema may not be ready yet. ' +
        'Run `npm run schema:sync` then restart the server.',
        err?.message,
      );
    }
  }

  private async seedCategories() {
    for (const seed of SEED_CATEGORIES) {
      const exists = await this.repo.findOne({ where: { slug: seed.slug } });
      if (!exists) {
        await this.repo.save(this.repo.create(seed));
        this.logger.log(`Seeded category: ${seed.name}`);
      }
    }
  }

  async findAll() {
    return this.redis.cacheOrFetch('categories:all',
      () => this.repo.findTrees(),
      3600,
    );
  }

  async findBySlug(slug: string): Promise<Category> {
    return this.repo.findOne({ where: { slug } });
  }

  async findById(id: string): Promise<Category> {
    return this.repo.findOne({ where: { id } });
  }

  async getSpecSchema(categoryId: string) {
    const cat = await this.findById(categoryId);
    return cat?.specSchema || {};
  }
}
