export declare class Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    image: string;
    sortOrder: number;
    isActive: boolean;
    specSchema: Record<string, {
        label: string;
        type: 'text' | 'number' | 'select' | 'multiselect';
        unit?: string;
        options?: string[];
        required: boolean;
        group?: string;
    }>;
    parent: Category;
    children: Category[];
    createdAt: Date;
    updatedAt: Date;
}
