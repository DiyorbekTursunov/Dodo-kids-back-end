import { ProductProtsessStatus } from "@prisma/client";

export interface ColorSizeRequest {
  colorId: string;
  sizeId: string;
  quantity: number;
  status?: ProductProtsessStatus;
}

export interface SizeGroupRequest {
  size: string;
  quantity: number;
  colorSizes: ColorSizeRequest[];
  status?: ProductProtsessStatus;
}

export interface ProductSettingRequest {
  totalCount: number;
  sizeGroups: SizeGroupRequest[];
  status?: ProductProtsessStatus;
}

export interface ProductRequest {
  name: string;
  allTotalCount: number;
  productSettings: ProductSettingRequest[];
  status?: ProductProtsessStatus;
}

export interface FileRequest {
  id: string;
}

export interface ProductGroupRequest {
  name: string;
  products: ProductRequest[];
  files?: FileRequest[]; // Updated to match request structure
  status?: ProductProtsessStatus;
}

export interface ProductsArrayRequest {
  productGroups: ProductGroupRequest[];
}

export interface ColorSizeData {
  colorSizeId: string;
  acceptCount: number;
  sendedCount: number;
  invalidCount: number;
  invalidReason: string;
}

export interface ProductData {
  productId: string;
  acceptCount: number;
  sendedCount: number;
  invalidCount: number;
  invalidReason: string;
  colorSizes: ColorSizeData[];
}

export interface RequestBody {
  invoiceId: string;
  targetDepartmentId: string;
  employeeId: string;
  products: ProductData[];
  outsourseCompanyId?: string;
}
