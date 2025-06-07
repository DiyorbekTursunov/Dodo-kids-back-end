import { Router } from 'express';
import {
  createProductGroupHandler,
  getProductHandler,
  getProductsHandler,
  updateProductHandler,
  deleteProductHandler,
  getAllProductGroupsHandler,
  deleteProductGroupHandler,
} from '../controller/product/product.controller';

const router = Router();

router.post('/', createProductGroupHandler);
router.get('/groups', getAllProductGroupsHandler);
router.get('/:id', getProductHandler);
router.put('/:id', updateProductHandler);
router.delete('/:id', deleteProductGroupHandler);



export default router;
