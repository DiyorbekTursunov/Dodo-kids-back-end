export interface ColorSizeRequest {
  colorId: string;
  quantity: number;
  status?: string;
}

export interface SizeRequest {
  sizeId: string;
  quantity: number;
  status?: string;
  colorSizes: ColorSizeRequest[];
}

export interface ProductSettingRequest {
  totalCount: number;
  status?: string;
  sizes: SizeRequest[];
}

export interface ProductRequest {
  name: string;
  allTotalCount: number;
  status?: string;
  productSettings: ProductSettingRequest[];
}

export interface ProductGroupRequest {
  name: string;
  status?: string;
  files?: { id: string }[];
  products: ProductRequest[];
}

export interface ProductsArrayRequest {
  productGroups: ProductGroupRequest[];
}
