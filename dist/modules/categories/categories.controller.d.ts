import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly svc;
    constructor(svc: CategoriesService);
    findAll(): Promise<import("./category.entity").Category[]>;
    findBySlug(slug: string): Promise<import("./category.entity").Category>;
    getSchema(id: string): Promise<Record<string, {
        label: string;
        type: "text" | "number" | "select" | "multiselect";
        unit?: string;
        options?: string[];
        required: boolean;
        group?: string;
    }>>;
}
