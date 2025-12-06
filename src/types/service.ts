export interface ServiceOrder {
    serviceType: "mix" | "master" | "production";
    price: number;
    filesUrl: string[];
    status: "draft" | "pending" | "paid" | "delivered";
    // TODO: Supabase Upload - subir archivos a Supabase Storage y guardar URL públicas
    // TODO: Supabase DB - persistir metadata de la orden en tabla service_orders
}

