import { Router } from 'express';
import {
  createProductGroupHandler,
  getProductHandler,
  getProductsHandler,
  updateProductHandler,
  deleteProductHandler,
} from '../controller/product/product.controller';

const router = Router();

router.post('/', createProductGroupHandler);
router.get('/', getProductsHandler);
router.get('/:id', getProductHandler);
router.put('/:id', updateProductHandler);
router.delete('/:id', deleteProductHandler);

export default router;
